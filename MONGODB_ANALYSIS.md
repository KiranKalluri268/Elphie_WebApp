# MongoDB Data Storage Analysis

## What We're Storing in MongoDB

### 1. **User Collection** (`User` model)
```javascript
{
  userFullName: String,          // User's full name
  userId: String,                 // Custom generated ID (e.g., "dr_john_2412151430abcd")
  role: String,                   // 'Doctor', 'Staff', 'Admin'
  mobileNumber: String,           // Optional
  email: String,                  // Optional
  password: String,               // ⚠️ NO LONGER USED (Cognito handles this)
  userImage: String,              // Profile image URL
  clinicId: ObjectId,            // Reference to Clinic
  elphieDoctorID: String,        // Integration with Elphie system
  cognitoUserId: String,          // ✅ Links to AWS Cognito user
  emailVerified: Boolean,         // ✅ Custom verification tracking
  phoneVerified: Boolean,         // ✅ Custom verification tracking
  initialVerificationMethod: String, // Which method was verified first
  timestamps: { createdAt, updatedAt }
}
```

### 2. **Clinic Collection** (`Clinic` model)
```javascript
{
  clinicName: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },
  contactNumber: String,
  clinicLicenseNumber: String,   // Unique identifier
  timestamps: { createdAt, updatedAt }
}
```

### 3. **Patient Collection** (`Patient` model)
```javascript
{
  patientId: String,              // Unique patient ID
  name: String,
  age: Number,
  gender: String,                 // 'Male', 'Female', 'Other'
  mobileNumber: String,
  email: String,
  address: String,
  clinicId: ObjectId,            // Reference to Clinic
  createdBy: ObjectId,            // Reference to User (who created)
  elphiePatientID: String,        // Integration with Elphie system
  visits: [{
    date: Date,
    chiefComplaint: String,
    notes: String,
    dentalRecords: [{
      toothNumber: String,
      notes: String,
      treatment: String,
      date: Date
    }]
  }],
  timestamps: { createdAt, updatedAt }
}
```

---

## What AWS Cognito Stores

### Cognito User Pool stores:
- ✅ **Username** (generated: `user_1234567890_abc123`)
- ✅ **Email** (if provided)
- ✅ **Phone Number** (if provided)
- ✅ **Password** (hashed by Cognito)
- ✅ **Email verification status** (Cognito native)
- ✅ **Phone verification status** (Cognito native)
- ✅ **Custom attributes** (e.g., `custom:role`)
- ✅ **MFA settings**
- ✅ **Account status** (CONFIRMED, UNCONFIRMED, etc.)

---

## Do We Still Need MongoDB?

### ✅ **YES - MongoDB is ABSOLUTELY REQUIRED**

### Why MongoDB is Still Essential:

#### 1. **Application-Specific Business Data**
   - **Clinic Information**: Clinic details, license numbers, addresses
   - **Patient Records**: Patient data, medical history, dental records
   - **Visit History**: Patient visits, treatments, notes
   - **Dental Records**: Tooth-specific treatments and notes
   - **Relationships**: Links between Users → Clinics → Patients

#### 2. **Data Cognito CANNOT Store**
   - ❌ Complex nested data structures (visits, dental records)
   - ❌ Relationships between entities (User → Clinic → Patient)
   - ❌ Business logic data (clinic licenses, patient IDs)
   - ❌ Medical/dental records (HIPAA-sensitive data)
   - ❌ Visit history and treatment notes
   - ❌ Custom business workflows

#### 3. **What We Store in MongoDB vs Cognito**

| Data Type | Cognito | MongoDB | Why |
|-----------|---------|---------|-----|
| **Authentication** | ✅ Password, Email, Phone | ❌ | Cognito handles auth |
| **User Profile** | ✅ Basic info (name, email, phone) | ✅ Extended info (role, clinic link, custom ID) | MongoDB for business logic |
| **Clinic Data** | ❌ | ✅ Complete clinic information | Business data |
| **Patient Data** | ❌ | ✅ All patient records | Medical data |
| **Visit History** | ❌ | ✅ All visits and treatments | Medical records |
| **Dental Records** | ❌ | ✅ Tooth-specific records | Medical data |
| **Relationships** | ❌ | ✅ User→Clinic→Patient links | Data relationships |
| **Verification Status** | ✅ Native verification | ✅ Custom tracking | Both for different purposes |

---

## Current Architecture

```
┌─────────────────┐
│  AWS Cognito    │  Handles: Authentication, User Identity
│                 │  Stores: Username, Email, Phone, Password
└────────┬────────┘
         │
         │ cognitoUserId (link)
         │
         ▼
┌─────────────────┐
│    MongoDB      │  Handles: Business Data, Medical Records
│                 │  Stores: Users, Clinics, Patients, Visits
└─────────────────┘
```

### How They Work Together:

1. **User Registration:**
   - Cognito: Creates user account, handles password, sends verification
   - MongoDB: Stores business data (role, clinic link, custom userId)

2. **User Login:**
   - Cognito: Authenticates user, returns JWT token
   - MongoDB: Provides user profile, clinic info, permissions

3. **Data Access:**
   - Cognito: Verifies token (who you are)
   - MongoDB: Provides data (what you can access)

---

## What We Can Remove from MongoDB

### ❌ **Can Remove:**
- `password` field - No longer needed (Cognito handles it)
- `comparePassword` method - No longer needed

### ✅ **Must Keep:**
- Everything else! All business data is essential.

---

## Summary

### MongoDB is Required For:
1. ✅ **Clinic Management** - Clinic data, licenses, addresses
2. ✅ **Patient Records** - All patient information
3. ✅ **Medical Data** - Visit history, dental records, treatments
4. ✅ **Business Logic** - User roles, clinic relationships, permissions
5. ✅ **Data Relationships** - Linking Users → Clinics → Patients
6. ✅ **Custom Tracking** - Verification status, custom IDs, Elphie integration

### Cognito is Used For:
1. ✅ **Authentication** - Login, password management
2. ✅ **User Identity** - Email, phone, basic profile
3. ✅ **Security** - Token management, MFA, account recovery
4. ✅ **Verification** - Email/phone verification

---

## Conclusion

**MongoDB is ABSOLUTELY REQUIRED and cannot be replaced by Cognito.**

They serve **different purposes**:
- **Cognito** = Authentication & Identity (WHO you are)
- **MongoDB** = Business Data & Records (WHAT you can access)

This is a **hybrid architecture** which is the **best practice** for applications that need:
- Secure authentication (Cognito)
- Complex business data (MongoDB)
- Medical/healthcare records (MongoDB)
- Data relationships (MongoDB)

---

## Recommendation

✅ **Keep MongoDB** - It's essential for your application  
✅ **Keep Cognito** - It handles authentication securely  
✅ **Remove password field** - Clean up unused code (optional)

**Both databases are needed and work together perfectly!** 🎯


