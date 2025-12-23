import { useState, useEffect } from 'react';
import api from '../utils/api';
import './ImagingDashboard.css';

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
    <div className="imaging-dashboard-overlay" onClick={onClose}>
      <div className="imaging-dashboard" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-header">
          <h2>Imaging Dashboard - Tooth {toothId}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="dashboard-content">
          <div className="records-section">
            <h3>Dental Records</h3>
            {records.length === 0 ? (
              <p className="no-records">No records found for this tooth</p>
            ) : (
              <div className="records-list">
                {records.map((record, index) => (
                  <div key={index} className="record-item">
                    <div className="record-header">
                      <span className="record-date">{formatDate(record.date)}</span>
                      {record.visitDate && (
                        <span className="visit-date">Visit: {formatDate(record.visitDate)}</span>
                      )}
                    </div>
                    {record.treatment && (
                      <div className="record-field">
                        <strong>Treatment:</strong> {record.treatment}
                      </div>
                    )}
                    {record.notes && (
                      <div className="record-field">
                        <strong>Notes:</strong> {record.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="add-record-section">
            <h3>Add New Record</h3>
            <form onSubmit={handleAddRecord} className="record-form">
              <div className="form-group">
                <label htmlFor="treatment">Treatment</label>
                <input
                  type="text"
                  id="treatment"
                  value={newRecord.treatment}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, treatment: e.target.value })
                  }
                  placeholder="Enter treatment details"
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="Enter notes"
                  rows="4"
                />
              </div>
              <button type="submit" className="submit-button" disabled={loading}>
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
