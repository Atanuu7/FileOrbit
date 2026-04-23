import cron from 'node-cron';
import File from '../models/File.js';
import { cloudinary } from '../config/cloudinary.js';

const startCleanupJob = () => {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('Running scheduled cleanup task...');
    try {
      const now = new Date();
      // Find files that are expired or reached max downloads
      const filesToDelete = await File.find({
        $or: [
          { expiresAt: { $lt: now } },
          { $expr: { $gte: ["$downloads", "$maxDownloads"] } }
        ]
      });

      for (const file of filesToDelete) {
        console.log(`Deleting expired file: ${file.shortCode}`);
        
        // Delete from Cloudinary
        try {
          await cloudinary.uploader.destroy(file.cloudinaryId);
        } catch (err) {
          console.error(`Failed to delete ${file.cloudinaryId} from Cloudinary:`, err);
        }

        // Delete from DB
        await File.deleteOne({ _id: file._id });
      }

      console.log(`Cleanup finished. Deleted ${filesToDelete.length} files.`);
    } catch (error) {
      console.error('Cleanup Job Error:', error);
    }
  });
};

export default startCleanupJob;
