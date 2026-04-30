import express from 'express';
import { cloudinary, upload } from '../config/cloudinary.js';
import File from '../models/File.js';
import { customAlphabet } from 'nanoid';
const nanoid_custom = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
import bcrypt from 'bcrypt';
import axios from 'axios';

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

    if (!file.url) {
      console.error('Download Error: File record found but URL is missing');
      return res.status(404).send('File storage link is missing');
    }

    // Use axios to fetch the file from Cloudinary as a stream
    // This handles redirects, both http/https, and gives us better control over headers
    const response = await axios({
      method: 'get',
      url: file.url,
      responseType: 'stream',
      timeout: 30000, // 30 second timeout for storage fetch
    });

    // Check if Cloudinary returned a success status
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Storage responded with status: ${response.status}`);
    }

    // Force the browser to download the file with its original name
    // Using both filename and filename* for maximum browser compatibility (handles special characters)
    const encodedName = encodeURIComponent(file.originalName);
    res.setHeader('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);

    // Forward the Content-Type and Content-Length if available
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    // Pipe the file data directly to the user's browser
    response.data.pipe(res);

    // Handle stream errors
    response.data.on('error', (err) => {
      console.error('Stream Error during download:', err);
      if (!res.headersSent) {
        res.status(500).send('Error streaming file');
      }
    });

  } catch (error) {
    console.error('Download Proxy Error Detail:', {
      message: error.message,
      url: file?.url,
      status: error.response?.status
    });
    
    if (!res.headersSent) {
      const status = error.response?.status || 500;
      res.status(status).send(`Download failed: ${error.message}. Please check if the file still exists in storage.`);
    }
  }
});

export default router;
