import express from 'express';
import Patient from '../models/Patient.js';
import { authenticateToken } from '../middleware/auth.js';
import { createPatientInElphie } from '../services/elphieService.js';

const router = express.Router();

// Get all patients for a clinic (separated into myPatients and allPatients)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { clinicId, userId } = req.user;
    const { search } = req.query;

    let baseQuery = { clinicId };
    let searchQuery = {};

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Query for my patients (created by current user)
    const myPatientsQuery = { ...baseQuery, createdBy: userId, ...searchQuery };
    const myPatients = await Patient.find(myPatientsQuery)
      .select('patientId name age gender mobileNumber visits')
      .sort({ createdAt: -1 })
      .lean();

    // Query for all patients in clinic
    const allPatientsQuery = { ...baseQuery, ...searchQuery };
    const allPatients = await Patient.find(allPatientsQuery)
      .select('patientId name age gender mobileNumber visits createdBy')
      .sort({ createdAt: -1 })
      .lean();

    // Format function
    const formatPatients = (patients) => {
      return patients.map(patient => {
        const lastVisit = patient.visits && patient.visits.length > 0
          ? patient.visits[patient.visits.length - 1]
          : null;

        return {
          _id: patient._id,
          patientId: patient.patientId,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          mobileNumber: patient.mobileNumber || '',
          lastVisitDate: lastVisit ? lastVisit.date : null,
          chiefComplaint: lastVisit ? lastVisit.chiefComplaint : null
        };
      });
    };

    res.json({
      myPatients: formatPatients(myPatients),
      allPatients: formatPatients(allPatients)
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('clinicId');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if patient belongs to user's clinic
    if (patient.clinicId._id.toString() !== req.user.clinicId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const lastVisit = patient.visits && patient.visits.length > 0
      ? patient.visits[patient.visits.length - 1]
      : null;

    res.json({
      ...patient.toObject(),
      lastVisitDate: lastVisit ? lastVisit.date : null,
      chiefComplaint: lastVisit ? lastVisit.chiefComplaint : null
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new patient
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { clinicId } = req.user;
    const { name, age, gender, mobileNumber, email, address } = req.body;

    if (!name || !age || !gender) {
      return res.status(400).json({ message: 'Name, age, and gender are required' });
    }

    // Create patient in Elphie backend first
    let elphiePatientID = null;
    if (mobileNumber) {
      try {
        const elphieResult = await createPatientInElphie(name, mobileNumber);
        
        if (elphieResult.success) {
          elphiePatientID = elphieResult.patientID;
          console.log(`Successfully created patient in Elphie: ${elphiePatientID}`);
        } else {
          // Log error but don't fail patient creation - allow webapp patient creation
          console.error(`Failed to create patient in Elphie: ${elphieResult.error}`);
          // You can choose to fail here if Elphie creation is mandatory:
          // return res.status(500).json({ message: `Failed to create Elphie patient: ${elphieResult.error}` });
        }
      } catch (elphieError) {
        console.error('Elphie patient creation error:', elphieError);
        // Continue with webapp patient creation even if Elphie fails
      }
    } else {
      console.warn('Patient mobile number not provided, skipping Elphie registration');
    }

    // Generate patient ID in format: {name_datetime} (short format for easy typing)
    const namePart = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').substring(0, 15); // Limit name part to 15 chars
    const now = new Date();
    // Use shorter datetime format: YYMMDDHHmm (10 chars) + random 4 chars for uniqueness
    const dateTime = now.toISOString().replace(/[-:T]/g, '').slice(2, 12); // Format: YYMMDDHHmm
    const randomStr = Math.random().toString(36).substring(2, 6); // 4 random alphanumeric chars
    let patientId = `${namePart}_${dateTime}${randomStr}`;
    
    // Ensure uniqueness by checking and retrying if needed
    let counter = 0;
    while (await Patient.findOne({ patientId }) && counter < 10) {
      const newRandomStr = Math.random().toString(36).substring(2, 6);
      patientId = `${namePart}_${dateTime}${newRandomStr}`;
      counter++;
    }

    const patient = new Patient({
      patientId,
      name,
      age,
      gender,
      mobileNumber,
      email,
      address,
      clinicId,
      createdBy: req.user.userId, // Store the doctor/user who created this patient
      elphiePatientID: elphiePatientID
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add visit to patient
router.post('/:id/visits', authenticateToken, async (req, res) => {
  try {
    const { chiefComplaint, notes } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.clinicId.toString() !== req.user.clinicId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    patient.visits.push({
      chiefComplaint: chiefComplaint || '',
      notes: notes || ''
    });

    await patient.save();
    res.json(patient);
  } catch (error) {
    console.error('Add visit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add dental record to a visit
router.post('/:id/visits/:visitId/dental-records', authenticateToken, async (req, res) => {
  try {
    const { toothNumber, notes, treatment } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.clinicId.toString() !== req.user.clinicId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visit = patient.visits.id(req.params.visitId);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    visit.dentalRecords.push({
      toothNumber,
      notes: notes || '',
      treatment: treatment || ''
    });

    await patient.save();
    res.json(patient);
  } catch (error) {
    console.error('Add dental record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
