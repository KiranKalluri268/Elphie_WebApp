# Elphie_Webapp(Dental Clinic Management System)

A full-stack web application for managing a dental clinic, built with React (frontend) and Node.js with Express and MongoDB (backend).

## Features

- **Authentication System**: Login and registration with JWT tokens
- **Clinic & User Registration**: Tabbed interface for clinic and user information
- **Patient Management**: Create, search, and manage patient records
- **Interactive Dental Chart**: Visual representation of teeth with FDI numbering system
- **Dental Records**: Track treatment and notes for individual teeth
- **Patient Profiles**: Comprehensive patient information and dental history

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Axios
- Vite

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dental-clinic
JWT_SECRET=your-secret-key-change-in-production
```

4. Start the MongoDB server (if using local MongoDB):
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
```

5. Start the backend server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or the port shown in terminal)

## Project Structure

```
elphie-webapp/
├── backend/
│   ├── models/
│   │   ├── Clinic.js
│   │   ├── User.js
│   │   └── Patient.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clinic.js
│   │   ├── patient.js
│   │   └── user.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Home.jsx
│   │   │   └── PatientProfile.jsx
│   │   ├── components/
│   │   │   ├── DentalChart.jsx
│   │   │   └── ImagingDashboard.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new clinic and user

### Patients
- `GET /api/patient` - Get all patients (with optional search query)
- `GET /api/patient/:id` - Get patient by ID
- `POST /api/patient` - Create new patient
- `POST /api/patient/:id/visits` - Add visit to patient
- `POST /api/patient/:id/visits/:visitId/dental-records` - Add dental record to visit

### Users
- `GET /api/user/me` - Get current user info

### Clinic
- `GET /api/clinic/:id` - Get clinic by ID

## Usage

1. **Registration**: Navigate to `/register` and fill in clinic and user information
2. **Login**: Use your User ID or Email and password to log in
3. **Create Patient**: Click "+ New Patient" button on the home page
4. **Search Patients**: Use the search bar to find patients by name, ID, or mobile number
5. **View Patient Profile**: Click "[Open Chart]" on any patient
6. **View Dental Chart**: Click on any tooth in the dental chart to open the Imaging Dashboard
7. **Add Records**: In the Imaging Dashboard, add treatment notes for specific teeth

## Dental Chart

The dental chart uses the FDI (Fédération Dentaire Internationale) numbering system:
- **Upper Jaw (Maxilla)**: Teeth 11-18 (right), 21-28 (left)
- **Lower Jaw (Mandible)**: Teeth 31-38 (right), 41-48 (left)

Each tooth is clickable and opens the Imaging Dashboard for that specific tooth.

## Development

### Backend Development
The backend uses ES modules. Make sure to use `import/export` syntax.

### Frontend Development
The frontend uses Vite for fast development with Hot Module Replacement (HMR).

## Production Build

### Frontend
```bash
cd frontend
npm run build
```

The built files will be in the `frontend/dist` directory.

### Backend
The backend can be run directly with Node.js in production:
```bash
cd backend
npm start
```

## Notes

- Make sure MongoDB is running before starting the backend
- Change the JWT_SECRET in production
- Update CORS settings if deploying frontend and backend separately
- User images are optional and not fully implemented in the current version

## License

ISC
