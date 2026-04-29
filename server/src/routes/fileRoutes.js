import express from 'express';
import { upload } from '../config/cloudinary.js';
import File from '../models/File.js';
import { nanoid } from 'nanoid';
import { customAlphabet } from 'nanoid';
const nanoid_custom = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
import bcrypt from 'bcrypt';
import { Readable } from 'stream';

const router = express.Router();

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { password, maxDownloads, expiresIn } = req.body;
    let hashedPassword = null;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const shortCode = nanoid_custom();
    const expiryMinutes = parseInt(expiresIn) || 30;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000); 

    const newFile = await File.create({
      originalName: req.file.originalname,
      cloudinaryId: req.file.filename,
      url: req.file.path,
      size: req.file.size,
      shortCode,
      expiresAt,
      password: hashedPassword,
      maxDownloads: parseInt(maxDownloads) || 3
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      code: shortCode,
      expiresAt,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

router.post('/:code', async (req, res) => {
  try {
    const { password } = req.body;
    const file = await File.findOne({ shortCode: req.params.code });

    if (!file) {
      return res.status(404).json({ error: 'File not found or expired' });
    }

    if (file.expiresAt < new Date()) {
      return res.status(404).json({ error: 'File expired' });
    }

    if (file.password) {
      if (!password) {
        return res.status(401).json({ error: 'Password required', requirePassword: true });
      }
      const isMatch = await bcrypt.compare(password, file.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password', requirePassword: true });
      }
    }

    if (file.downloads >= file.maxDownloads) {
      return res.status(403).json({ error: 'Maximum downloads reached' });
    }

    file.downloads += 1;
    await file.save();

    res.json({
      originalName: file.originalName,
      url: file.url,
      size: file.size,
      downloads: file.downloads,
      maxDownloads: file.maxDownloads
    });

  } catch (error) {
    console.error('Retrieve Error:', error);
    res.status(500).json({ error: 'Server error retrieving file' });
  }
});

router.get('/download/:code', async (req, res) => {
  try {
    const file = await File.findOne({ shortCode: req.params.code });

    if (!file) {
      return res.status(404).send('File not found or expired');
    }

    // Fetch the file from Cloudinary
    const response = await fetch(file.url);
    if (!response.ok) throw new Error('Failed to fetch from Cloudinary');

    // Set headers to force download
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');

    // Stream the body to the response
    const reader = response.body.getReader();
    
    // Node.js Express response doesn't directly support Web Streams API reader in all versions, 
    // but we can convert it or use a more standard approach for Node.
    // Since we are on a modern Node version, we can use the response.body directly if it's a stream.
    
    // Re-fetching using a more Node-friendly way if needed, 
    // but actually, response.body in Node's fetch is a ReadableStream.
    // For Express, we need a Node Readable.
    
    const nodeReadable = Readable.fromWeb(response.body);
    nodeReadable.pipe(res);

  } catch (error) {
    console.error('Proxy Download Error:', error);
    res.status(500).send('Error processing download');
  }
});

export default router;
