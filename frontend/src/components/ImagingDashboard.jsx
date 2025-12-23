import { useState, useEffect } from 'react';
import api from '../utils/api';

function ImagingDashboard({ toothId, patientId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({
    notes: '',
    treatment: '',
  });

  useEffect(() => {
    fetchRecords();
  }, [toothId, patientId]);

  const fetchRecords = async () => {
    try {
      const response = await api.get(`/patient/${patientId}`);
      const patient = response.data;
      const toothRecords = [];

      if (patient.visits) {
        patient.visits.forEach((visit) => {
          if (visit.dentalRecords) {
            visit.dentalRecords.forEach((record) => {
              if (record.toothNumber === toothId) {
                toothRecords.push({
                  ...record,
                  visitDate: visit.date,
                });
              }
            });
          }
        });
      }

      setRecords(toothRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!newRecord.notes && !newRecord.treatment) {
      alert('Please enter notes or treatment');
      return;
    }

    try {
      setLoading(true);
      // Get the latest visit or create a new one
      const patientResponse = await api.get(`/patient/${patientId}`);
      const patient = patientResponse.data;

      let visitId;
      if (patient.visits && patient.visits.length > 0) {
        visitId = patient.visits[patient.visits.length - 1]._id;
      } else {
        // Create a new visit first
        const visitResponse = await api.post(`/patient/${patientId}/visits`, {
          chiefComplaint: '',
        });
        visitId = visitResponse.data.visits[visitResponse.data.visits.length - 1]._id;
      }

      await api.post(`/patient/${patientId}/visits/${visitId}/dental-records`, {
        toothNumber: toothId,
        notes: newRecord.notes,
        treatment: newRecord.treatment,
      });

      setNewRecord({ notes: '', treatment: '' });
      fetchRecords();
      alert('Record added successfully');
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Failed to add record');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-[800px] max-h-[90vh] flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center py-5 px-8 border-b-2 border-gray-200 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white">
          <h2 className="m-0 text-2xl">Imaging Dashboard - Tooth {toothId}</h2>
          <button className="w-9 h-9 flex items-center justify-center bg-white/20 border border-white/30 text-white rounded-full text-2xl cursor-pointer transition-colors hover:bg-white/30" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex flex-col gap-8">
          <div>
            <h3 className="m-0 mb-5 text-[#333] text-xl border-b-2 border-gray-200 pb-2.5">Dental Records</h3>
            {records.length === 0 ? (
              <p className="text-[#666] text-center p-10 italic">No records found for this tooth</p>
            ) : (
              <div className="flex flex-col gap-4">
                {records.map((record, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#667eea]">
                    <div className="flex justify-between mb-2.5 text-sm text-[#666]">
                      <span className="font-semibold text-[#333]">{formatDate(record.date)}</span>
                      {record.visitDate && (
                        <span className="text-xs">Visit: {formatDate(record.visitDate)}</span>
                      )}
                    </div>
                    {record.treatment && (
                      <div className="mt-2 text-[#333]">
                        <strong className="text-[#667eea] mr-2">Treatment:</strong> {record.treatment}
                      </div>
                    )}
                    {record.notes && (
                      <div className="mt-2 text-[#333]">
                        <strong className="text-[#667eea] mr-2">Notes:</strong> {record.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="m-0 mb-5 text-[#333] text-xl border-b-2 border-gray-200 pb-2.5">Add New Record</h3>
            <form onSubmit={handleAddRecord} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="treatment" className="font-medium text-[#333] text-sm">Treatment</label>
                <input
                  type="text"
                  id="treatment"
                  value={newRecord.treatment}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, treatment: e.target.value })
                  }
                  placeholder="Enter treatment details"
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="notes" className="font-medium text-[#333] text-sm">Notes</label>
                <textarea
                  id="notes"
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="Enter notes"
                  rows="4"
                  className="p-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-[#667eea]"
                />
              </div>
              <button type="submit" className="py-3 px-6 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-0 rounded-lg text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
                {loading ? 'Saving...' : 'Save Record'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImagingDashboard;
