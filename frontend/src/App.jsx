import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyContact from './pages/VerifyContact';
import Home from './pages/Home';
import PatientProfile from './pages/PatientProfile';


function PrivateRoute({ children }) {
  // Check for user data in localStorage
  // The actual authentication is verified by the backend using Cognito tokens
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-contact" element={<VerifyContact />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/:patientId"
          element={
            <PrivateRoute>
              <PatientProfile />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
