import express from 'express';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';
import { registerDoctorInElphie } from '../services/elphieService.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';
import { sessions } from '../utils/sessions.js';

const router = express.Router();

// Note: Login is now handled by Cognito on the frontend
// This endpoint is kept for backward compatibility or can be removed

// Register (after Cognito signup)
router.post('/register', async (req, res) => {
  try {
    const {
      // Clinic Info
      clinicName,
      address,
      contactNumber,
      clinicLicenseNumber,
      // User Info
      userFullName,
      role,
      mobileNumber,
      email,
      cognitoUserId,
    } = req.body;

    // Validate required fields
    if (!clinicName || !address || !contactNumber || !clinicLicenseNumber) {
      return res.status(400).json({ message: 'All clinic fields are required' });
    }

    if (!userFullName || !role || !cognitoUserId) {
      return res.status(400).json({ message: 'All user fields are required' });
    }

    // Validate: at least one contact method
    if (!email && !mobileNumber) {
      return res.status(400).json({ message: 'At least email or mobile number is required' });
    }

    // Check if clinic license already exists
    let clinic = await Clinic.findOne({ clinicLicenseNumber });
    if (!clinic) {
      // Create clinic if it doesn't exist
      clinic = new Clinic({
        clinicName,
        address,
        contactNumber,
        clinicLicenseNumber
      });
      await clinic.save();
    }

    // Check if user already exists by email or phone
    const existingUser = await User.findOne({
      $or: [
        { cognitoUserId }, // Same Cognito user
        ...(email ? [{ email }] : []),
        ...(mobileNumber ? [{ mobileNumber }] : [])
      ]
    });

    let user;
    let isNewUser = false;
    
    if (existingUser) {
      // User exists - check if it's the same Cognito user or a re-registration
      if (existingUser.cognitoUserId === cognitoUserId) {
        // Same Cognito user trying to register again
        return res.status(400).json({ message: 'User already exists' });
      } else {
        // Different Cognito user ID - user was deleted from Cognito and re-registered
        // Update the existing user with new Cognito ID (keep existing userId)
        existingUser.cognitoUserId = cognitoUserId;
        existingUser.userFullName = userFullName;
        existingUser.role = role;
        existingUser.mobileNumber = mobileNumber || existingUser.mobileNumber;
        existingUser.email = email || existingUser.email;
        existingUser.clinicId = clinic._id;
        existingUser.emailVerified = false;
        existingUser.phoneVerified = false;
        existingUser.initialVerificationMethod = null;
        await existingUser.save();
        user = existingUser;
      }
    } else {
      // Generate userId for new user
      const namePart = userFullName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const now = new Date();
      const dateTime = now.toISOString().replace(/[-:T]/g, '').slice(2, 12);
      const randomStr = Math.random().toString(36).substring(2, 6);
      const generatedUserId = `${namePart}_${dateTime}${randomStr}`;
      
      // Create new user
      user = new User({
        userFullName,
        userId: generatedUserId,
        role,
        mobileNumber: mobileNumber || null,
        email: email || null,
        clinicId: clinic._id,
        cognitoUserId,
        elphieDoctorID: null,
        emailVerified: false,
        phoneVerified: false,
      });
      await user.save();
      isNewUser = true;
    }

    // Register doctor in Elphie if role is Doctor (only for new users)
    if (isNewUser && role === 'Doctor' && email) {
      try {
        const elphieUsername = email;
        // Note: We don't have password here since Cognito handles it
        // You may need to adjust Elphie integration
        console.log(`Doctor registration - Elphie integration may need adjustment for Cognito`);
        // If Elphie registration is needed, update user.elphieDoctorID here
      } catch (elphieError) {
        console.error('Elphie registration error:', elphieError);
      }
    }

    res.status(201).json({
      message: existingUser ? 'Registration updated. Please verify your contact information.' : 'Registration successful. Please verify your contact information.',
      user: {
        id: user._id,
        userId: user.userId,
        cognitoUserId: user.cognitoUserId,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Update verification status
router.post('/update-verification-status', async (req, res) => {
  try {
    const { cognitoUserId, emailVerified, phoneVerified } = req.body;

    const user = await User.findOne({ cognitoUserId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update verification status
    if (emailVerified !== undefined) {
      user.emailVerified = emailVerified;
      if (emailVerified && !user.initialVerificationMethod) {
        user.initialVerificationMethod = 'email';
      }
    }
    
    if (phoneVerified !== undefined) {
      user.phoneVerified = phoneVerified;
      if (phoneVerified && !user.initialVerificationMethod) {
        user.initialVerificationMethod = 'phone';
      }
    }

    await user.save();

    res.json({ 
      message: 'Verification status updated',
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    });
  } catch (error) {
    console.error('Update verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user info by username/email (for unconfirmed users - OTP skipped)
router.post('/login-without-confirmation', async (req, res) => {
  try {
    const { username } = req.body; // Can be email, phone, or username
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Find user by email, phone, or username
    const user = await User.findOne({
      $or: [
        { email: username },
        { mobileNumber: username },
        { userId: username }
      ]
    }).populate('clinicId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    // Store session
    sessions.set(sessionToken, {
      userId: user._id.toString(),
      cognitoUserId: user.cognitoUserId,
      clinicId: user.clinicId?._id.toString(),
      expiresAt
    });

    // Return user info with session token
    res.json({
      id: user._id,
      userId: user.userId,
      name: user.userFullName,
      role: user.role,
      email: user.email,
      mobileNumber: user.mobileNumber,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      clinicId: user.clinicId?._id,
      clinicName: user.clinicId?.clinicName,
      cognitoUserId: user.cognitoUserId,
      sessionToken, // Include session token
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user info (after Cognito auth)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ cognitoUserId: req.user.cognitoUserId })
      .populate('clinicId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Skip OTP verification - allow access even if verification is not complete
    // const hasVerifiedContact = user.emailVerified || user.phoneVerified;
    // 
    // if (!hasVerifiedContact) {
    //   return res.status(403).json({ 
    //     message: 'Please verify at least one contact method',
    //     emailVerified: user.emailVerified,
    //     phoneVerified: user.phoneVerified,
    //     email: user.email,
    //     mobileNumber: user.mobileNumber,
    //     cognitoUserId: user.cognitoUserId,
    //   });
    // }

    res.json({
      id: user._id,
      userId: user.userId,
      name: user.userFullName,
      role: user.role,
      email: user.email,
      mobileNumber: user.mobileNumber,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      clinicId: user.clinicId._id,
      clinicName: user.clinicId.clinicName,
      cognitoUserId: user.cognitoUserId,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
