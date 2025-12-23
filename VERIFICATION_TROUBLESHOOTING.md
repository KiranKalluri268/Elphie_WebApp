# Verification Code Troubleshooting Guide

## How to Check if Verification Code Was Sent

### Method 1: Check Browser Console

After registration, open browser console (F12) and look for:
```
Verification Details: {
  signUpStep: "CONFIRM_SIGN_UP",
  codeDeliveryDetails: {
    attributeName: "email",
    deliveryMedium: "EMAIL",
    destination: "d***@example.com"
  }
}
```

This confirms:
- ✅ Code was sent
- ✅ Delivery method (EMAIL or SMS)
- ✅ Destination (masked email/phone)

---

### Method 2: Check AWS Cognito Console

1. **Go to AWS Console** → Cognito → Your User Pool
2. **Click "Users"** in left sidebar
3. **Find your user** (search by email or username)
4. **Click on the username** to open user details

#### Check User Status:
- **Account status**: Should be `UNCONFIRMED` (if not verified)
- **Email verified**: Should show `false` (if not verified)
- **Phone verified**: Should show `false` (if not verified)

#### Check Message Delivery:
1. Scroll down to **"Message delivery history"** section
2. Look for recent messages:
   - **Type**: Verification code
   - **Status**: Sent / Failed
   - **Delivery method**: EMAIL or SMS
   - **Timestamp**: When it was sent

---

### Method 3: Check CloudWatch Logs (Advanced)

1. **AWS Console** → CloudWatch → Log groups
2. Search for: `/aws/cognito/userpool`
3. Look for log entries with your user pool ID
4. Check for email/SMS delivery logs

---

## Common Issues & Solutions

### Issue 1: No Email Received

**Possible Causes:**
1. **Email in spam folder** - Check spam/junk folder
2. **Cognito daily limit** - 50 emails/day (default)
3. **Email provider blocking** - Some providers block automated emails
4. **Wrong email address** - Verify email is correct

**Solutions:**
- ✅ Check spam folder
- ✅ Use "Resend Code" button
- ✅ Verify email address in Cognito console
- ✅ Wait 24 hours if daily limit reached
- ✅ Use SMS instead (if phone provided)

---

### Issue 2: Code Not Sent (Status: Failed)

**Check in Cognito Console:**
1. User details → Message delivery history
2. Look for failed messages
3. Check error message

**Common Errors:**
- **Email address invalid** - Fix email format
- **SMS delivery failed** - Check phone number format (must be E.164: +919876543210)
- **Daily limit exceeded** - Wait 24 hours or upgrade to SES/SNS

---

### Issue 3: User Shows "Email Verified: No" but Code Not Received

**This is normal!** The user is created but not verified yet.

**Options:**
1. **Wait for email** (check spam)
2. **Resend code** using "Resend Code" button
3. **Manually verify** in Cognito Console (for testing)

---

## Manual Verification (For Testing)

### Option 1: Verify in Cognito Console

1. **AWS Console** → Cognito → Your User Pool → Users
2. **Click on the username**
3. **Click "Actions"** dropdown → **"Confirm user"**
4. **Select attribute to confirm:**
   - Email address
   - Phone number
5. **Click "Confirm"**

**Note:** This bypasses verification code - use only for testing!

---

### Option 2: Use AWS CLI

```bash
# Verify email
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username user_1234567890_abc123 \
  --user-attributes Name=email_verified,Value=true

# Verify phone
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username user_1234567890_abc123 \
  --user-attributes Name=phone_number_verified,Value=true
```

---

## Testing Without Email/SMS

### For Development/Testing:

1. **Manually verify in Cognito Console** (as shown above)
2. **Or use test email addresses** that you can access
3. **Or configure AWS SES** for production (higher limits)

---

## How to Resend Code

### In Your Application:
1. Go to `/verify-contact` page
2. Click **"Resend Code"** button
3. Check email/phone again

### In Cognito Console:
1. User details → **"Actions"** → **"Resend verification code"**
2. Select attribute (email or phone)
3. Code will be sent again

---

## Debugging Steps

### Step 1: Check Browser Console
```javascript
// After registration, check console for:
console.log('Cognito Signup Result:', cognitoResult);
```

### Step 2: Check Cognito User Status
- User Pool → Users → Your user
- Check account status and verification status

### Step 3: Check Message Delivery
- User details → Message delivery history
- Look for sent/failed messages

### Step 4: Verify Email/Phone Format
- Email: Must be valid format (user@domain.com)
- Phone: Must be E.164 format (+919876543210)

### Step 5: Check Daily Limits
- Cognito default: 50 emails/day, 50 SMS/day
- If exceeded, wait 24 hours or upgrade

---

## Quick Fixes

### Fix 1: Resend Code
```javascript
// In verify-contact page, click "Resend Code"
// Or use Cognito Console → Actions → Resend verification code
```

### Fix 2: Manual Verification (Testing Only)
```
Cognito Console → Users → Your User → Actions → Confirm user
```

### Fix 3: Check Email Format
- Ensure email is correct
- Check spam folder
- Verify email provider isn't blocking

### Fix 4: Check Phone Format
- Must be E.164: +919876543210
- Include country code (+91 for India)
- No spaces or dashes

---

## Production Recommendations

For production, consider:

1. **AWS SES for Email:**
   - Higher limits (62,000/month free tier)
   - Custom sender email
   - Better deliverability

2. **AWS SNS for SMS:**
   - Pay-per-use (no daily limit)
   - Better delivery rates
   - Custom messages

3. **Custom Email Templates:**
   - Branded emails
   - Better user experience

---

## Summary

✅ **Check browser console** for verification details  
✅ **Check Cognito Console** for user status and message delivery  
✅ **Check spam folder** for emails  
✅ **Use "Resend Code"** if not received  
✅ **Manually verify** in Cognito Console for testing  
✅ **Check daily limits** (50 emails/SMS per day default)  

**Most common issue:** Email in spam folder or daily limit reached! 📧


