import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import DentalChart from '../components/DentalChart';
import ImagingDashboard from '../components/ImagingDashboard';
import './PatientProfile.css';

function PatientProfile() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [showImagingDashboard, setShowImagingDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const response = await api.get(`/patient/${patientId}`);
      setPatient(response.data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      alert('Failed to load patient data');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleToothClick = (toothId) => {
    setSelectedTooth(toothId);
    setShowImagingDashboard(true);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'chart') {
      setShowImagingDashboard(false);
      setSelectedTooth(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading-container">Loading patient data...</div>;
  }

  if (!patient) {
    return <div className="error-container">Patient not found</div>;
  }

  return (
    <div className="patient-profile-container">
      <header className="profile-header">
        <button onClick={() => navigate('/home')} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Patient Profile</h1>
      </header>

      <div className="profile-content">
        <div className="patient-info-panel">
          <h2>Patient Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{patient.name}</span>
            </div>
            <div className="info-item">
              <label>Age:</label>
              <span>{patient.age}</span>
            </div>
            <div className="info-item">
              <label>Gender:</label>
              <span>{patient.gender}</span>
            </div>
            <div className="info-item">
              <label>Patient ID:</label>
              <span>{patient.patientId}</span>
            </div>
            <div className="info-item">
              <label>Last Visit Date:</label>
              <span>{formatDate(patient.lastVisitDate)}</span>
            </div>
            <div className="info-item full-width">
              <label>Chief Complaint:</label>
              <span>{patient.chiefComplaint || 'N/A'}</span>
            </div>
            {patient.mobileNumber && (
              <div className="info-item">
                <label>Mobile:</label>
                <span>{patient.mobileNumber}</span>
              </div>
            )}
            {patient.email && (
              <div className="info-item">
                <label>Email:</label>
                <span>{patient.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="dental-chart-section">
          <div className="dental-chart-tabs">
            <button
              type="button"
              className={`tab-button ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => handleTabChange('chart')}
            >
              Interactive Dental Chart
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => handleTabChange('videos')}
            >
              Videos
            </button>
          </div>
          <h2>{activeTab === 'chart' ? 'Interactive Dental Chart' : 'Videos'}</h2>
          <div className="tab-content">
            {activeTab === 'chart' ? (
              <DentalChart onToothClick={handleToothClick} patient={patient} />
            ) : (
              <div className="videos-placeholder">
                <p>Video walkthroughs for this patient will appear here.</p>
                <p>Select a video to review imaging sessions and procedures.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'chart' && showImagingDashboard && (
        <ImagingDashboard
          toothId={selectedTooth}
          patientId={patientId}
          onClose={() => {
            setShowImagingDashboard(false);
            setSelectedTooth(null);
          }}
        />
      )}
    </div>
  );
}

export default PatientProfile;
