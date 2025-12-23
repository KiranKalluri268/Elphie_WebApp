# Elphie Backend Integration

## Overview

This integration connects the webapp (Node.js/Express/MongoDB) with the Elphie backend (Lambda/DynamoDB). When doctors register or patients are created in the webapp, corresponding accounts are automatically created in the Elphie backend, and the generated IDs are stored in the webapp database.

## Architecture

```
Webapp Registration/Patient Creation
    ↓
Webapp Backend (Node.js/Express)
    ↓
Elphie Service (HTTP Request)
    ↓
Elphie Lambda (AWS Lambda)
    ↓
DynamoDB (Elphie Database)
    ↓
Return DoctorID/PatientID
    ↓
Store in MongoDB (Webapp Database)
```

## Implementation Details

### 1. Database Schema Updates

#### User Model (Doctors)
- Added `elphieDoctorID` field to store the DoctorID returned from Elphie Lambda
- Field is optional (default: null) to allow webapp registration even if Elphie fails

#### Patient Model
- Added `elphiePatientID` field to store the PatientID returned from Elphie Lambda
- Field is optional (default: null) to allow webapp patient creation even if Elphie fails

### 2. Elphie Service (`backend/services/elphieService.js`)

#### `registerDoctorInElphie(username, password)`
- **Purpose**: Register a doctor account in Elphie backend
- **Parameters**:
  - `username`: Username for Elphie (typically email or generated from name)
  - `password`: Password for Elphie account
- **Returns**: `{success: boolean, doctorID?: string, error?: string}`
- **Endpoint**: POST to Elphie Lambda with `action: 'register'`

#### `createPatientInElphie(name, phoneNumber)`
- **Purpose**: Create a patient account in Elphie backend
- **Parameters**:
  - `name`: Patient full name
  - `phoneNumber`: Patient phone number (required by Elphie)
- **Returns**: `{success: boolean, patientID?: string, error?: string}`
- **Endpoint**: POST to `/patients` endpoint on Elphie Lambda

### 3. Registration Flow (Doctors)

**Route**: `POST /api/auth/register`

**Flow**:
1. Validate webapp registration data
2. Generate userId in format: `{name_datetime}`
3. Create clinic in MongoDB
4. **If role is "Doctor"**:
   - Call `registerDoctorInElphie(email, password)`
   - Store returned `DoctorID` in `user.elphieDoctorID`
5. Create user in MongoDB with `elphieDoctorID`
6. Return JWT token and user data

**Notes**:
- Elphie registration only happens for users with `role === 'Doctor'`
- Uses email as username for Elphie (fallback to normalized name)
- If Elphie registration fails, webapp registration still succeeds (graceful degradation)
- To make Elphie registration mandatory, uncomment the error return in the code

### 4. Patient Creation Flow

**Route**: `POST /api/patient`

**Flow**:
1. Validate patient data
2. **If mobileNumber is provided**:
   - Call `createPatientInElphie(name, mobileNumber)`
   - Store returned `PatientID` in `patient.elphiePatientID`
3. Generate patientId for webapp: `PAT-{count}`
4. Create patient in MongoDB with `elphiePatientID`
5. Return patient data

**Notes**:
- Elphie patient creation requires `mobileNumber` (as per Lambda requirements)
- If mobileNumber is missing, Elphie registration is skipped
- If Elphie creation fails, webapp patient creation still succeeds
- To make Elphie creation mandatory, uncomment the error return in the code

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# Elphie Lambda Backend URL
ELPHIE_LAMBDA_URL=https://k6eautcco2.execute-api.ap-south-1.amazonaws.com/default/DentalAppAuth
```

**Note**: For patient creation to work, ensure API Gateway has a `/patients` route configured that routes to the same Lambda function. The service will try to construct the `/patients` URL automatically.

## Error Handling

### Graceful Degradation
- If Elphie registration/creation fails, the webapp operation still succeeds
- Errors are logged to console but don't block the main operation
- `elphieDoctorID` or `elphiePatientID` will be `null` if Elphie creation failed

### Making Elphie Mandatory
To make Elphie registration mandatory (fail webapp registration if Elphie fails):

In `backend/routes/auth.js`, uncomment:
```javascript
// return res.status(500).json({ message: `Failed to create Elphie account: ${elphieResult.error}` });
```

In `backend/routes/patient.js`, uncomment:
```javascript
// return res.status(500).json({ message: `Failed to create Elphie patient: ${elphieResult.error}` });
```

## Testing

### Test Doctor Registration
1. Register a new doctor in the webapp
2. Check MongoDB: User document should have `elphieDoctorID` field
3. Check DynamoDB: New doctor record should exist with the same username

### Test Patient Creation
1. Create a new patient with mobile number
2. Check MongoDB: Patient document should have `elphiePatientID` field
3. Check DynamoDB: New patient record should exist

## API Gateway Configuration Note

For patient creation to work properly, ensure your API Gateway has:
- Route: `POST /patients` → Same Lambda function
- OR configure Lambda to handle action-based routing for patients

The service automatically tries multiple methods:
1. Constructs `/patients` URL from base Lambda URL
2. Falls back to posting to main endpoint with patient data

## Troubleshooting

### Doctor Registration Fails
- Check Elphie Lambda logs
- Verify `ELPHIE_LAMBDA_URL` is correct
- Check if username already exists in DynamoDB
- Verify password meets Elphie requirements

### Patient Creation Fails
- Check if API Gateway has `/patients` route configured
- Verify patient mobile number is provided
- Check Elphie Lambda logs for errors
- Verify Lambda function handles `/patients` path correctly

## Future Enhancements

- Add retry logic for failed Elphie requests
- Add sync mechanism to update existing records
- Add admin endpoint to manually sync Elphie IDs
- Add webhook to notify webapp when Elphie records are updated
