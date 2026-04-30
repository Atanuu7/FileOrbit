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

    // Detect resource type accurately for Cloudinary signing
    let resourceType = req.file.resource_type;
    if (!resourceType) {
      if (req.file.mimetype.startsWith('image/')) resourceType = 'image';
      else if (req.file.mimetype.startsWith('video/')) resourceType = 'video';
      else resourceType = 'raw';
    }

    // Capture the most accurate Cloudinary ID (preferring public_id if available)
    const cloudinaryId = req.file.public_id || req.file.filename;

    const newFile = await File.create({
      originalName: req.file.originalname,
      cloudinaryId: cloudinaryId,
      url: req.file.path,
      resourceType: resourceType,
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

    console.log(`[Download] Initiating for: ${file.originalName} (${file.resourceType})`);

    // Prepare Authentication
    const auth = Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64');

    try {
      // SMART PROXY: Try to fetch with authentication
      const response = await axios({
        method: 'get',
        url: file.url,
        headers: { 'Authorization': `Basic ${auth}` },
        responseType: 'stream',
        timeout: 45000
      });

      const encodedName = encodeURIComponent(file.originalName);
      res.setHeader('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      
      return response.data.pipe(res);

    // LAYER 2: Secure Redirect Fallback (Official SDK Utility)
    // We use private_download_url which is the most reliable way to generate 
    // signed download links for any resource type (raw, video, image).
    const extension = file.originalName.split('.').pop();
    const signedUrl = cloudinary.utils.private_download_url(file.cloudinaryId, extension, {
      resource_type: file.resourceType || 'raw',
      attachment: true,
      secure: true
    });

    console.log(`[Download] Redirecting to stable SDK URL: ${signedUrl}`);
    return res.redirect(signedUrl);

  } catch (error) {
    console.error('CRITICAL Download Error:', {
      message: error.message,
      code: error.code
    });
    if (!res.headersSent) {
      res.status(500).send(`System error during download: ${error.message}`);
    }
  }
});

export default router;
