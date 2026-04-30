import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  cloudinaryId: { type: String, required: true },
  url: { type: String, required: true },
  resourceType: { type: String, default: 'image' },
  size: { type: Number, required: true },
  shortCode: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  password: { type: String, default: null },
  downloads: { type: Number, default: 0 },
  maxDownloads: { type: Number, default: 3 }
}, { timestamps: true });

export default mongoose.model('File', fileSchema);
