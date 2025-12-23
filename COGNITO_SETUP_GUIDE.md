# AWS Cognito Authentication Setup Guide

## Implementation Complete ✓

All code changes have been implemented. Follow the steps below to configure AWS Cognito and run the application.

---

## AWS Console Configuration Steps

### Step 1: Create Cognito User Pool

1. Go to **AWS Console** → Search "Cognito" → Click "Cognito"
2. Click **"Create user pool"**

### Step 2: Configure Sign-in Experience

**Step 1 of 6: Configure sign-in experience**
- Sign-in options: ✓ **Email** and ✓ **Phone number**
- User name requirements: ✓ **Allow users to sign in with a preferred user name**
- Click **"Next"**

### Step 3: Configure Security Requirements

**Step 2 of 6: Configure security requirements**
- Password policy: **Cognito defaults** (or customize as needed)
- Multi-factor authentication: **No MFA** (optional, can enable later)
- User account recovery: ✓ **Enable self-service account recovery**
  - Delivery method: **Email and SMS**
- Click **"Next"**

### Step 4: Configure Sign-up Experience

**Step 3 of 6: Configure sign-up experience**
- Self-registration: ✓ **Enable self-registration**
- Attribute verification and user account confirmation:
  - Allow Cognito to automatically send messages: **Yes**
  - Attributes to verify: ✓ **Send email message, verify email address** AND ✓ **Send SMS message, verify phone number**
  - Keep user account active: **Yes** (allows login with at least one verified)
  - Required attributes: ✓ **name**
  - Custom attributes: Click "Add custom attribute"
    - Name: `role`
    - Type: `String`
    - Min length: 1
    - Max length: 50
- Click **"Next"**

### Step 5: Configure Message Delivery

**Step 4 of 6: Configure message delivery**

**Email:**
- Email provider: **Send email with Cognito** (Option 1 - 50 emails/day limit)
- FROM email address: `no-reply@verificationemail.com` (default)

**SMS:**
- SMS: **Use Amazon SNS - Recommended**
- IAM role: **Create a new IAM role**
- Role name: Auto-generated (e.g., `Cognito-SMS-Role`)

Click **"Next"**

### Step 6: Integrate Your App

**Step 5 of 6: Integrate your app**
- User pool name: `dental-clinic-users` (or your choice)
- Hosted authentication pages: Skip (not using hosted UI)
- Domain: Skip
- Initial app client:
  - App client name: `dental-clinic-web-app`
  - Client secret: **Don't generate a client secret** ✓
  - Authentication flows: 
    - ✓ **ALLOW_USER_PASSWORD_AUTH**
    - ✓ **ALLOW_REFRESH_TOKEN_AUTH**
- Click **"Next"**

### Step 7: Review and Create

**Step 6 of 6: Review and create**
- Review all settings
- Click **"Create user pool"**

### Step 8: Get Configuration Values

After creation:

1. **User Pool ID:**
   - In your User Pool → "User pool overview"
   - Copy the **User pool ID**: `us-east-1_XXXXXXXXX`

2. **AWS Region:**
   - Note the region from the User Pool ID (e.g., `us-east-1`)

3. **Client ID:**
   - Go to **"App integration"** tab
   - Scroll down to **"App clients and analytics"**
   - Click on your app client name
   - Copy the **Client ID**: `xxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Environment Configuration

### Frontend Configuration

Create/Update `frontend/.env`:

```env
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=us-east-1
VITE_API_URL=http://localhost:5000/api
```

**Replace the placeholder values with your actual Cognito configuration.**

### Backend Configuration

Create/Update `backend/.env`:

```env
# MongoDB (use existing configuration - MONGODB_URI or separate parts)
# Option 1: Direct URI
MONGODB_URI=mongodb://localhost:27017/dental-clinic

# Option 2: Or use existing separate parts (already configured)
# MONGO_PROD_USR=...
# MONGO_PROD_CLUSTER_PASS=...
# MONGO_PROD_DB=...
# MONGO_PROD_DETAILS=...

# AWS Cognito (ADD THESE NEW VARIABLES)
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1

# Elphie Integration (already configured)
ELPHIE_LAMBDA_URL=https://k6eautcco2.execute-api.ap-south-1.amazonaws.com/default/DentalAppAuth

# Server (already configured)
PORT=5000
```

**Replace the placeholder values with your actual Cognito configuration.**

---

## How It Works

### Registration Flow

1. **User fills registration form:**
   - Must provide **at least one**: Email OR Mobile Number
   - Both clinic and user information required

2. **Cognito signup:**
   - User account created in AWS Cognito
   - Verification codes sent to provided email/phone

3. **Database registration:**
   - Clinic and user records created in MongoDB
   - Linked to Cognito user via `cognitoUserId`

4. **Verification page:**
   - User enters verification code
   - At least ONE contact method must be verified to proceed

5. **Login enabled:**
   - After verifying at least one contact method
   - User can login and access the application

### Login Flow

1. **User enters credentials:**
   - Email or Mobile Number
   - Password

2. **Cognito authentication:**
   - Validates credentials
   - Returns ID token, Access token, Refresh token

3. **Backend verification:**
   - Checks if at least one contact is verified
   - If not verified → redirects to verification page
   - If verified → allows access

4. **Session established:**
   - Tokens managed by AWS Amplify
   - Automatic token refresh
   - User info stored in localStorage

### Verification Status

- **Email Verified:** ✓ Green badge
- **Phone Verified:** ✓ Green badge
- **Unverified:** ⚠ Orange badge with "Verify" button

Users can verify remaining contacts later from their profile (to be implemented).

---

## Testing the Implementation

### 1. Start Backend
```bash
cd backend
npm start
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Registration

1. Go to `http://localhost:5173/register`
2. Fill in clinic information
3. Fill in user information with:
   - **Option A:** Email only (e.g., `doctor@clinic.com`)
   - **Option B:** Mobile only (e.g., `+919876543210`)
   - **Option C:** Both email and mobile
4. Set password (must meet Cognito requirements)
5. Click "Save / Register"

### 4. Test Verification

1. Check your email/phone for verification code
2. Enter the 6-digit code
3. Click "Verify"
4. Should redirect to login page

### 5. Test Login

1. Go to `http://localhost:5173/login`
2. Enter email or mobile number used during registration
3. Enter password
4. Click "Login"
5. Should redirect to home page

---

## Key Features Implemented

✅ Flexible registration (email OR mobile, or both)  
✅ AWS Cognito authentication  
✅ Email verification (Cognito default - 50/day)  
✅ SMS verification (Cognito default - 50/day)  
✅ At least one verification mandatory for login  
✅ Verification status tracking in database  
✅ Automatic token management via AWS Amplify  
✅ Secure token verification in backend  
✅ User-friendly verification page  
✅ Clear error messages  

---

## Important Notes

### Cognito Limits (Option 1 - Default)

- **Email:** 50 emails per day (free tier)
- **SMS:** 50 SMS per day (free tier)
- **Sender:** Generic "no-reply@verificationemail.com"

For production, consider upgrading to:
- **Email:** AWS SES (custom domain, higher limits)
- **SMS:** AWS SNS (pay-per-use, higher limits)

### Phone Number Format

Phone numbers must be in **E.164 format**:
- India: `+919876543210`
- US: `+11234567890`

The frontend automatically formats Indian numbers.

### Security

- Passwords never stored in your database
- Cognito handles all password hashing and validation
- Tokens verified using Cognito's public keys
- Automatic token refresh (no manual intervention)

### Cost Considerations

- **Cognito:** 50,000 MAUs free per month
- **Email (default):** 50/day free
- **SMS (SNS):** ~$0.00645 per SMS (US), ~$0.00225 (India)

---

## Troubleshooting

### Issue: "Invalid or expired token"
- **Solution:** Clear browser cache and localStorage, try logging in again

### Issue: "User not found" after login
- **Solution:** Ensure user completed verification and database registration

### Issue: Verification code not received
- **Solution:** 
  - Check spam folder (for email)
  - Verify phone number format (+919876543210)
  - Check Cognito daily limits (50 emails/SMS)

### Issue: "Please verify at least one contact method"
- **Solution:** Complete verification flow before attempting login

---

## Next Steps (Optional Enhancements)

1. **Profile Page:** Allow users to verify remaining contacts from profile
2. **Password Reset:** Implement forgot password flow using Cognito
3. **MFA:** Enable multi-factor authentication for added security
4. **Custom Email Templates:** Use AWS SES for branded emails
5. **Social Login:** Add Google/Facebook login via Cognito

---

## Files Modified

### Frontend
- ✅ `frontend/src/main.jsx` - Amplify configuration
- ✅ `frontend/src/config/cognito.js` - Cognito config
- ✅ `frontend/src/services/cognitoAuth.js` - Auth service
- ✅ `frontend/src/utils/api.js` - API interceptor
- ✅ `frontend/src/pages/Register.jsx` - Registration flow
- ✅ `frontend/src/pages/Login.jsx` - Login flow
- ✅ `frontend/src/pages/VerifyContact.jsx` - Verification page (new)
- ✅ `frontend/src/pages/VerifyContact.css` - Verification styles (new)
- ✅ `frontend/src/App.jsx` - Added verification route
- ✅ `frontend/.env` - Environment variables (needs your values)

### Backend
- ✅ `backend/models/User.js` - Added verification fields
- ✅ `backend/middleware/auth.js` - Cognito token verification
- ✅ `backend/routes/auth.js` - Updated auth endpoints
- ✅ `backend/.env.example` - Environment template

### Packages Installed
- ✅ Frontend: `aws-amplify`, `@aws-amplify/ui-react`
- ✅ Backend: `aws-jwt-verify`

---

## Support

For issues or questions:
1. Check AWS Cognito documentation
2. Review AWS Amplify documentation
3. Check CloudWatch logs for backend errors
4. Verify environment variables are set correctly

---

**Setup Complete! 🎉**

Follow the AWS Console steps above, configure your environment variables, and start testing!

