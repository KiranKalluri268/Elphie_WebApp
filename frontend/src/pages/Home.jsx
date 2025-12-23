import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Home.css';

function Home() {
  const [myPatients, setMyPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    mobileNumber: '',
    email: '',
    address: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (search = '') => {
    try {
      setLoading(true);
      const response = await api.get('/patient', {
        params: search ? { search } : {},
      });
      // Handle new response format with myPatients and allPatients
      if (response.data.myPatients && response.data.allPatients) {
        setMyPatients(response.data.myPatients);
        setAllPatients(response.data.allPatients);
      } else {
        // Fallback for old format
        setMyPatients(response.data || []);
        setAllPatients(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchPatients(value);
  };

  const handleNewPatientChange = (e) => {
    setNewPatientData({
      ...newPatientData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNewPatientSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patient', newPatientData);
      setShowNewPatientForm(false);
      setNewPatientData({
        name: '',
        age: '',
        gender: 'Male',
        mobileNumber: '',
        email: '',
        address: '',
      });
      fetchPatients(searchTerm);
    } catch (error) {
      console.error('Error creating patient:', error);
      alert(error.response?.data?.message || 'Failed to create patient');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleOpenChart = (patientId) => {
    navigate(`/patient/${patientId}`);
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="home-container">
      <header className="home-header">
        <div>
          <h1>Patient Dashboard</h1>
          <p className="clinic-name">{user.clinicName || 'Dental Clinic'}</p>
        </div>
        <div className="user-info">
          <span>{user.name || 'User'}</span>
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="home-content">
        <div className="home-actions">
          <button
            className="new-patient-button"
            onClick={() => setShowNewPatientForm(!showNewPatientForm)}
          >
            + New Patient
          </button>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search by Patient Name, Patient ID, or Mobile Number"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>

        {showNewPatientForm && (
          <div className="new-patient-form-container">
            <form onSubmit={handleNewPatientSubmit} className="new-patient-form">
              <h3>New Patient Registration</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newPatientData.name}
                    onChange={handleNewPatientChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={newPatientData.age}
                    onChange={handleNewPatientChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={newPatientData.gender}
                    onChange={handleNewPatientChange}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={newPatientData.mobileNumber}
                    onChange={handleNewPatientChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newPatientData.email}
                    onChange={handleNewPatientChange}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={newPatientData.address}
                    onChange={handleNewPatientChange}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Create Patient</button>
                <button
                  type="button"
                  onClick={() => setShowNewPatientForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Patients Table */}
        <div className="patient-table-container">
          <h2 className="table-section-title">My Patients</h2>
          {loading ? (
            <div className="loading">Loading patients...</div>
          ) : myPatients.length === 0 ? (
            <div className="no-patients">No patients found</div>
          ) : (
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Mobile Number</th>
                  <th>Last Visit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {myPatients.map((patient) => (
                  <tr key={patient._id}>
                    <td>{patient.patientId || 'N/A'}</td>
                    <td>{patient.name}</td>
                    <td>{patient.age}</td>
                    <td>{patient.gender}</td>
                    <td>{patient.mobileNumber || 'N/A'}</td>
                    <td>{formatDate(patient.lastVisitDate)}</td>
                    <td>
                      <button
                        className="open-chart-button"
                        onClick={() => handleOpenChart(patient._id)}
                      >
                        [Open Chart]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* All Patients Table */}
        <div className="patient-table-container" style={{ marginTop: '2rem' }}>
          <h2 className="table-section-title">All Patients</h2>
          {loading ? (
            <div className="loading">Loading patients...</div>
          ) : allPatients.length === 0 ? (
            <div className="no-patients">No patients found</div>
          ) : (
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Mobile Number</th>
                  <th>Last Visit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allPatients.map((patient) => (
                  <tr key={patient._id}>
                    <td>{patient.patientId || 'N/A'}</td>
                    <td>{patient.name}</td>
                    <td>{patient.age}</td>
                    <td>{patient.gender}</td>
                    <td>{patient.mobileNumber || 'N/A'}</td>
                    <td>{formatDate(patient.lastVisitDate)}</td>
                    <td>
                      <button
                        className="open-chart-button"
                        onClick={() => handleOpenChart(patient._id)}
                      >
                        [Open Chart]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
