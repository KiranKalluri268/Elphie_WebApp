import { CognitoJwtVerifier } from 'aws-jwt-verify';
import User from '../models/User.js';
import { sessions } from '../utils/sessions.js';

// Lazy-load verifier to ensure environment variables are loaded
let verifier = null;

const getVerifier = () => {
  if (!verifier) {
    if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) {
      throw new Error('Cognito environment variables not configured. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID in .env file');
    }
    
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      tokenUse: 'id',
      clientId: process.env.COGNITO_CLIENT_ID,
    });
  }
  return verifier;
};

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  // First, try to verify as Cognito token
  try {
    const cognitoVerifier = getVerifier();
    const payload = await cognitoVerifier.verify(token);
    
    // Get user from database to populate clinicId
    const user = await User.findOne({ cognitoUserId: payload.sub }).populate('clinicId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = {
      userId: user._id.toString(),
      cognitoUserId: payload.sub,
      clinicId: user.clinicId?._id.toString(),
      email: payload.email,
      phone: payload.phone_number,
      name: payload.name,
    };
    return next();
  } catch (cognitoError) {
    // If Cognito verification fails, try session token
    const session = sessions.get(token);
    
    if (session && session.expiresAt > Date.now()) {
      // Session token is valid
      const user = await User.findById(session.userId).populate('clinicId');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      req.user = {
        userId: user._id.toString(),
        cognitoUserId: user.cognitoUserId,
        clinicId: user.clinicId?._id.toString(),
        email: user.email,
        phone: user.mobileNumber,
        name: user.userFullName,
      };
      return next();
    } else if (session && session.expiresAt <= Date.now()) {
      // Session expired
      sessions.delete(token);
      return res.status(401).json({ message: 'Session expired' });
    }
    
    // Neither Cognito nor session token worked
    console.error('Token verification error:', cognitoError);
    
    if (cognitoError.message && cognitoError.message.includes('Cognito environment variables')) {
      return res.status(500).json({ message: cognitoError.message });
    }
    
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
