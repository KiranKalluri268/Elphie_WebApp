# Quick Start Guide - AWS Cognito Integration

## ⚡ Quick Setup (5 Minutes)

### 1. AWS Console Setup
1. Go to AWS Cognito → Create User Pool
2. Enable **Email** and **Phone number** sign-in
3. Configure verification for both email and SMS
4. Create app client (no secret, enable USER_PASSWORD_AUTH)
5. Copy: **User Pool ID**, **Client ID**, **Region**

### 2. Configure Environment Variables

**Frontend (`frontend/.env`):**
```env
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=us-east-1
VITE_API_URL=http://localhost:5000/api
```

**Backend (`backend/.env`):**
```env
# Add these NEW Cognito variables to your existing .env file:
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1

# Keep your existing MongoDB and other configurations
```

### 3. Start Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Test Registration

1. Go to `http://localhost:5173/register`
2. Fill form with **email OR mobile** (at least one required)
3. Submit → Receive verification code
4. Enter code → Verify
5. Login with credentials

---

## 📋 Key Changes

### What Changed?
- ✅ JWT authentication → AWS Cognito
- ✅ Email/Mobile now optional (at least one required)
- ✅ Verification mandatory before login
- ✅ Tokens managed by AWS Amplify
- ✅ Backend verifies Cognito tokens

### User Flow
```
Register → Verify (Email/Phone) → Login → Access App
         ↓
    At least ONE verification required
```

---

## 🔑 Important Notes

1. **Phone Format:** Must be E.164 format (`+919876543210`)
2. **Verification:** At least ONE contact must be verified to login
3. **Limits:** 50 emails/SMS per day (Cognito default)
4. **Tokens:** Automatically managed by Amplify (no manual handling)

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| No verification code | Check spam, verify phone format, check daily limits |
| "User not found" | Complete verification before login |
| "Invalid token" | Clear cache, login again |
| Can't login | Ensure at least one contact is verified |

---

## 📚 Full Documentation

See `COGNITO_SETUP_GUIDE.md` for detailed AWS Console steps and complete documentation.

---

**Ready to go! 🚀**

