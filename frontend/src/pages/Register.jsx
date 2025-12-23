import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUpUser } from '../services/cognitoAuth';
import api from '../utils/api';

function Register() {
  const [activeTab, setActiveTab] = useState('clinic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clinicData, setClinicData] = useState({
    clinicName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
    },
    contactNumber: '',
    clinicLicenseNumber: '',
  });
  const [userData, setUserData] = useState({
    userFullName: '',
    role: 'Staff',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    userImage: null,
  });
  const navigate = useNavigate();

  const handleClinicChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setClinicData({
        ...clinicData,
        address: {
          ...clinicData.address,
          [field]: value,
        },
      });
    } else {
      setClinicData({
        ...clinicData,
        [name]: value,
      });
    }
    setError('');
  };

  const handleUserChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setUserData({
        ...userData,
        [name]: files[0] || null,
      });
    } else {
      setUserData({
        ...userData,
        [name]: value,
      });
    }
    setError('');
  };

  const handleCancel = () => {
    setClinicData({
      clinicName: '',
      address: { street: '', city: '', state: '', zip: '' },
      contactNumber: '',
      clinicLicenseNumber: '',
    });
    setUserData({
      userFullName: '',
      role: 'Staff',
      mobileNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
      userImage: null,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate: at least one contact method required
      if (!userData.email && !userData.mobileNumber) {
        setError('Please provide at least email or mobile number');
        setLoading(false);
        return;
      }

      if (userData.password !== userData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Prepare Cognito user attributes
      const userAttributes = {
        name: userData.userFullName,
        'custom:role': userData.role,
      };

      if (userData.email) {
        userAttributes.email = userData.email;
      }

      if (userData.mobileNumber) {
        // Format phone to E.164 format (+919876543210)
        const cleaned = userData.mobileNumber.replace(/\D/g, '');
        const formatted = cleaned.startsWith('91') ? `+${cleaned}` : `+91${cleaned}`;
        userAttributes.phone_number = formatted;
      }

      // Generate a unique username (not email format) for Cognito
      // Cognito will use email/phone as aliases for login
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const username = `user_${timestamp}_${randomStr}`;

      // 1. Register in Cognito
      const cognitoResult = await signUpUser(username, userData.password, userAttributes);

      if (!cognitoResult.success) {
        setError(cognitoResult.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Log verification details for debugging
      console.log('Cognito Signup Result:', {
        userId: cognitoResult.userId,
        nextStep: cognitoResult.nextStep,
        codeDeliveryDetails: cognitoResult.nextStep?.codeDeliveryDetails
      });

      // 2. Register in backend database
      const registrationData = {
        ...clinicData,
        userFullName: userData.userFullName,
        role: userData.role,
        mobileNumber: userData.mobileNumber || null,
        email: userData.email || null,
        cognitoUserId: cognitoResult.userId,
      };

      await api.post('/auth/register', registrationData);

      // 3. Navigate to verification page with verification details
      navigate('/verify-contact', {
        state: {
          email: userData.email,
          phoneNumber: userData.mobileNumber,
          username: username,
          cognitoUserId: cognitoResult.userId,
          nextStep: cognitoResult.nextStep, // Pass verification details
        }
      });

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] py-10 px-5">
      <div className="max-w-[700px] mx-auto bg-white rounded-xl shadow-2xl p-10">
        <h1 className="text-center text-gray-800 mb-8 text-3xl font-bold">New User Registration</h1>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-5 text-sm border border-red-200">{error}</div>}

        <div className="flex gap-2.5 mb-8 border-b-2 border-gray-200">
          <button
            className={`py-3 px-6 bg-transparent border-0 border-b-[3px] border-transparent text-base font-medium text-gray-500 cursor-pointer transition-all hover:text-[#667eea] ${activeTab === 'clinic' ? 'text-[#667eea] border-b-[#667eea]' : ''}`}
            onClick={() => setActiveTab('clinic')}
          >
            Clinic Info
          </button>
          <button
            className={`py-3 px-6 bg-transparent border-0 border-b-[3px] border-transparent text-base font-medium text-gray-500 cursor-pointer transition-all hover:text-[#667eea] ${activeTab === 'user' ? 'text-[#667eea] border-b-[#667eea]' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            User (Doctor/Staff) Info
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {activeTab === 'clinic' && (
            <div className="flex flex-col gap-5 min-h-[400px]">
              <div className="flex flex-col gap-2">
                <label htmlFor="clinicName" className="font-medium text-gray-800 text-sm">Clinic Name *</label>
                <input
                  type="text"
                  id="clinicName"
                  name="clinicName"
                  value={clinicData.clinicName}
                  onChange={handleClinicChange}
                  required
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="address.street" className="font-medium text-gray-800 text-sm">Street Address *</label>
                <input
                  type="text"
                  id="address.street"
                  name="address.street"
                  value={clinicData.address.street}
                  onChange={handleClinicChange}
                  required
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="address.city" className="font-medium text-gray-800 text-sm">City *</label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={clinicData.address.city}
                    onChange={handleClinicChange}
                    required
                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="address.state" className="font-medium text-gray-800 text-sm">State *</label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={clinicData.address.state}
                    onChange={handleClinicChange}
                    required
                    className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="address.zip" className="font-medium text-gray-800 text-sm">Zip Code *</label>
                <input
                  type="text"
                  id="address.zip"
                  name="address.zip"
                  value={clinicData.address.zip}
                  onChange={handleClinicChange}
                  required
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="contactNumber" className="font-medium text-gray-800 text-sm">Contact Number *</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={clinicData.contactNumber}
                  onChange={handleClinicChange}
                  required
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="clinicLicenseNumber" className="font-medium text-gray-800 text-sm">Clinic License # *</label>
                <input
                  type="text"
                  id="clinicLicenseNumber"
                  name="clinicLicenseNumber"
                  value={clinicData.clinicLicenseNumber}
                  onChange={handleClinicChange}
                  required
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>
            </div>
          )}

          {activeTab === 'user' && (
            <div className="flex flex-col gap-5 min-h-[400px]">
              <div className="flex flex-col gap-2">
                <label htmlFor="userFullName" className="font-medium text-gray-800 text-sm">User Full Name *</label>
                <input
                  type="text"
                  id="userFullName"
                  name="userFullName"
                  value={userData.userFullName}
                  onChange={handleUserChange}
                  required
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="role" className="font-medium text-gray-800 text-sm">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={userData.role}
                  onChange={handleUserChange}
                  required
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                >
                  <option value="Doctor">Doctor</option>
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="mobileNumber" className="font-medium text-gray-800 text-sm">Mobile Number (at least one required)</label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={userData.mobileNumber}
                  onChange={handleUserChange}
                  placeholder="+91 9876543210"
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-medium text-gray-800 text-sm">Email (at least one required)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userData.email}
                  onChange={handleUserChange}
                  placeholder="doctor@clinic.com"
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="font-medium text-gray-800 text-sm">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={userData.password}
                  onChange={handleUserChange}
                  required
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="font-medium text-gray-800 text-sm">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={userData.confirmPassword}
                  onChange={handleUserChange}
                  required
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>

              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                * At least one contact method (Email or Mobile Number) is required
              </p>
            </div>
          )}

          <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-lg text-base font-semibold cursor-pointer transition-all text-center border-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Save / Register'}
            </button>
            <button
              type="button"
              className="py-3 px-6 rounded-lg text-base font-semibold cursor-pointer transition-all text-center border-0 bg-gray-100 text-gray-800 hover:bg-gray-200"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <Link
              to="/login"
              className="py-3 px-6 rounded-lg text-base font-semibold cursor-pointer transition-all text-center no-underline bg-white text-[#667eea] border-2 border-[#667eea] hover:bg-indigo-50"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
