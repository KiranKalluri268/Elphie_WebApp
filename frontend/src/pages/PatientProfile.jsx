import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import DentalChart from '../components/DentalChart';
import ImagingDashboard from '../components/ImagingDashboard';

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
    return <div className="flex items-center justify-center min-h-screen text-lg text-[#666]">Loading patient data...</div>;
  }

  if (!patient) {
    return <div className="flex items-center justify-center min-h-screen text-lg text-[#c33]">Patient not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white py-5 px-10 flex items-center gap-5">
        <button onClick={() => navigate('/home')} className="py-2 px-4 bg-white/20 border border-white/30 text-white rounded-md cursor-pointer text-sm transition-colors decoration-0 hover:bg-white/30">
          ← Back to Dashboard
        </button>
        <h1 className="m-0 text-3xl">Patient Profile</h1>
      </header>

      <div className="max-w-[1400px] mx-auto py-8 px-5 flex flex-col gap-8">
        <div className="bg-white rounded-xl p-8 shadow-md">
          <h2 className="m-0 mb-5 text-[#333] text-2xl border-b-2 border-gray-200 pb-2.5">Patient Information</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#666] text-sm">Name:</label>
              <span className="text-[#333] text-base">{patient.name}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#666] text-sm">Age:</label>
              <span className="text-[#333] text-base">{patient.age}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#666] text-sm">Gender:</label>
              <span className="text-[#333] text-base">{patient.gender}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#666] text-sm">Patient ID:</label>
              <span className="text-[#333] text-base">{patient.patientId}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#666] text-sm">Last Visit Date:</label>
              <span className="text-[#333] text-base">{formatDate(patient.lastVisitDate)}</span>
            </div>
            <div className="flex flex-col gap-1.5 col-span-full">
              <label className="font-semibold text-[#666] text-sm">Chief Complaint:</label>
              <span className="text-[#333] text-base">{patient.chiefComplaint || 'N/A'}</span>
            </div>
            {patient.mobileNumber && (
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#666] text-sm">Mobile:</label>
                <span className="text-[#333] text-base">{patient.mobileNumber}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[#666] text-sm">Email:</label>
                <span className="text-[#333] text-base">{patient.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-md">
          <div className="flex gap-3 mb-5">
            <button
              type="button"
              className={`py-2.5 px-4.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold cursor-pointer transition-all hover:bg-gray-200 ${activeTab === 'chart' ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-transparent shadow-[0_4px_12px_rgba(102,126,234,0.35)]' : ''}`}
              onClick={() => handleTabChange('chart')}
            >
              Interactive Dental Chart
            </button>
            <button
              type="button"
              className={`py-2.5 px-4.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold cursor-pointer transition-all hover:bg-gray-200 ${activeTab === 'videos' ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-transparent shadow-[0_4px_12px_rgba(102,126,234,0.35)]' : ''}`}
              onClick={() => handleTabChange('videos')}
            >
              Videos
            </button>
          </div>
          <h2 className="m-0 mb-5 text-[#333] text-2xl border-b-2 border-gray-200 pb-2.5">{activeTab === 'chart' ? 'Interactive Dental Chart' : 'Videos'}</h2>
          <div className="min-h-[200px]">
            {activeTab === 'chart' ? (
              <DentalChart onToothClick={handleToothClick} patient={patient} />
            ) : (
              <div className="flex flex-col gap-2 p-10 text-center text-gray-600 bg-gray-50 border border-dashed border-indigo-200 rounded-xl">
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
