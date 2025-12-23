import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white py-5 px-10 flex justify-between items-center shadow-md">
        <div>
          <h1 className="m-0 text-3xl">Patient Dashboard</h1>
          <p className="mt-1 opacity-90 text-sm">{user.clinicName || 'Dental Clinic'}</p>
        </div>
        <div className="flex items-center gap-4">
          <span>{user.name || 'User'}</span>
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            className="py-2 px-4 bg-white/20 border border-white/30 text-white rounded-md cursor-pointer text-sm transition-colors hover:bg-white/30"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto py-8 px-5">
        <div className="flex gap-5 mb-8 items-center">
          <button
            className="py-3 px-6 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-0 rounded-lg text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
            onClick={() => setShowNewPatientForm(!showNewPatientForm)}
          >
            + New Patient
          </button>

          <div className="flex-1 max-w-[500px]">
            <input
              type="text"
              placeholder="Search by Patient Name, Patient ID, or Mobile Number"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
            />
          </div>
        </div>

        {showNewPatientForm && (
          <div className="bg-white rounded-xl p-8 mb-8 shadow-md">
            <form onSubmit={handleNewPatientSubmit}>
              <h3 className="m-0 mb-5 text-[#333]">New Patient Registration</h3>
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[#333] text-sm">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newPatientData.name}
                    onChange={handleNewPatientChange}
                    required
                    className="p-2.5 border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#667eea]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[#333] text-sm">Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={newPatientData.age}
                    onChange={handleNewPatientChange}
                    required
                    className="p-2.5 border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#667eea]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[#333] text-sm">Gender *</label>
                  <select
                    name="gender"
                    value={newPatientData.gender}
                    onChange={handleNewPatientChange}
                    required
                    className="p-2.5 border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#667eea]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[#333] text-sm">Mobile Number</label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={newPatientData.mobileNumber}
                    onChange={handleNewPatientChange}
                    className="p-2.5 border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#667eea]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[#333] text-sm">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newPatientData.email}
                    onChange={handleNewPatientChange}
                    className="p-2.5 border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#667eea]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[#333] text-sm">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={newPatientData.address}
                    onChange={handleNewPatientChange}
                    className="p-2.5 border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#667eea]"
                  />
                </div>
              </div>
              <div className="flex gap-2.5">
                <button type="submit" className="py-2.5 px-5 border-0 rounded-md text-sm font-semibold cursor-pointer bg-[#667eea] text-white hover:bg-[#5568d3]">Create Patient</button>
                <button
                  type="button"
                  onClick={() => setShowNewPatientForm(false)}
                  className="py-2.5 px-5 border-0 rounded-md text-sm font-semibold cursor-pointer bg-gray-100 text-[#333] hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Patients Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-md mb-5">
          <h2 className="m-0 py-5 px-5 text-xl font-semibold text-[#333] border-b-2 border-gray-200 bg-gray-50">My Patients</h2>
          {loading ? (
            <div className="p-10 text-center text-[#666]">Loading patients...</div>
          ) : myPatients.length === 0 ? (
            <div className="p-10 text-center text-[#666]">No patients found</div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Patient ID</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Name</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Age</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Gender</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Mobile Number</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Last Visit</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Action</th>
                </tr>
              </thead>
              <tbody>
                {myPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50">
                    <td className="p-4 border-b border-gray-200 text-[#666]">{patient.patientId || 'N/A'}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">{patient.name}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">{patient.age}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">{patient.gender}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">{patient.mobileNumber || 'N/A'}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">{formatDate(patient.lastVisitDate)}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">
                      <button
                        className="py-1.5 px-3 bg-[#667eea] text-white border-0 rounded-md cursor-pointer text-sm transition-colors hover:bg-[#5568d3]"
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
        <div className="bg-white rounded-xl overflow-hidden shadow-md mb-5" style={{ marginTop: '2rem' }}>
          <h2 className="m-0 py-5 px-5 text-xl font-semibold text-[#333] border-b-2 border-gray-200 bg-gray-50">All Patients</h2>
          {loading ? (
            <div className="p-10 text-center text-[#666]">Loading patients...</div>
          ) : allPatients.length === 0 ? (
            <div className="p-10 text-center text-[#666]">No patients found</div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Patient ID</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Name</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Age</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Gender</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Mobile Number</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Last Visit</th>
                  <th className="p-4 text-left font-semibold text-[#333] border-b-2 border-gray-200">Action</th>
                </tr>
              </thead>
              <tbody>
                {allPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50">
                    <td className="p-4 border-b border-gray-200 text-[#666]">{patient.patientId || 'N/A'}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">{patient.name}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">{patient.age}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">{patient.gender}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">{patient.mobileNumber || 'N/A'}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">{formatDate(patient.lastVisitDate)}</td>
                    <td className="p-4 border-b border-gray-200 text-[#666]">
                      <button
                        className="py-1.5 px-3 bg-[#667eea] text-white border-0 rounded-md cursor-pointer text-sm transition-colors hover:bg-[#5568d3]"
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
