import express from 'express';
import Clinic from '../models/Clinic.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get clinic by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    res.json(clinic);
  } catch (error) {
    console.error('Get clinic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
