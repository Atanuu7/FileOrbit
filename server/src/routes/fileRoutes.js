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
    if (!resourceType && req.file.path) {
      if (req.file.path.includes('/image/upload/')) resourceType = 'image';
      else if (req.file.path.includes('/video/upload/')) resourceType = 'video';
      else if (req.file.path.includes('/raw/upload/')) resourceType = 'raw';
    }
    
    if (!resourceType) {
      if (req.file.mimetype.startsWith('image/')) resourceType = 'image';
      else if (req.file.mimetype.startsWith('video/')) resourceType = 'video';
      else resourceType = 'raw';
    }

    // Capture the most accurate Cloudinary ID (preferring public_id if available)
    const cloudinaryId = req.file.public_id || req.file.filename;
    console.log('[Upload] Multer File Object:', JSON.stringify(req.file, null, 2));
    console.log(`[Upload] Detected Resource Type: ${resourceType}, Cloudinary ID: ${cloudinaryId}`);

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

    const extension = file.originalName.split('.').pop();
    const versionMatch = file.url.match(/\/v(\d+)\//);
    const version = versionMatch ? versionMatch[1] : null;
    
    // Generate the signed delivery URL
    // We MUST include the version if the Cloudinary account has strict security enabled
    const downloadUrl = cloudinary.url(file.cloudinaryId, {
      resource_type: file.resourceType || 'image',
      format: extension,
      flags: 'attachment',
      version: version,
      sign_url: true,
      secure: true
    });

    try {
      // LAYER 1: Smart Proxy
      // We stream from the signed URL. 
      console.log(`[Download] Proxying from signed URL: ${downloadUrl}`);
      
      const response = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'stream',
        timeout: 60000,
        headers: {
          'User-Agent': 'FileOrbit-Server/2.0'
        }
      });

      const encodedName = encodeURIComponent(file.originalName);
      res.setHeader('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      
      return response.data.pipe(res);

    } catch (proxyError) {
      const status = proxyError.response ? proxyError.response.status : 'N/A';
      console.error(`[Download] Proxy Failed (Status: ${status}, Message: ${proxyError.message}). Redirecting...`);
      
      // LAYER 2: Direct Redirect Fallback
      return res.redirect(downloadUrl);
    }

  } catch (error) {
    console.error('CRITICAL Download Error:', error.message);
    if (!res.headersSent) {
      res.status(500).send(`System error during download: ${error.message}`);
    }
  }
});

export default router;
