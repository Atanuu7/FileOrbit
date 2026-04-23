import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import fileRoutes from './src/routes/fileRoutes.js';
import startCleanupJob from './src/utils/cleanup.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to DB
connectDB();

// Middleware
// Update this CORS configuration for production (Vercel) later
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/files', fileRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'FileOrbit API is running' });
});

// Start cleanup cron job
startCleanupJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
