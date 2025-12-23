import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import clinicRoutes from './routes/clinic.js';
import patientRoutes from './routes/patient.js';
import userRoutes from './routes/user.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
let MONGODB_URI = process.env.MONGODB_URI;

// If MONGODB_URI is not set, construct it from separate parts
if (!MONGODB_URI) {
  const mongoUser = process.env.MONGO_PROD_USR || '';
  const mongoPass = process.env.MONGO_PROD_CLUSTER_PASS || '';
  const mongoDb = process.env.MONGO_PROD_DB || '';
  const mongoDetails = process.env.MONGO_PROD_DETAILS || '';

  // Remove quotes if present (from .env file)
  const cleanUser = mongoUser.replace(/^["']|["']$/g, '');
  const cleanPass = mongoPass.replace(/^["']|["']$/g, '');
  const cleanDb = mongoDb.replace(/^["']|["']$/g, '');
  const cleanDetails = mongoDetails.replace(/^["']|["']$/g, '');

  // If all parts are provided, construct the URI
  if (cleanUser && cleanPass && cleanDb && cleanDetails) {
    MONGODB_URI = `${cleanUser}${cleanPass}${cleanDb}${cleanDetails}`;
    console.log('Constructed MongoDB URI from environment variables');
  } else {
    console.log("Couldn't Constructed MongoDB URI from environment variables");
  }
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
