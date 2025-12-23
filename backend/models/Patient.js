import mongoose from 'mongoose';

const dentalRecordSchema = new mongoose.Schema({
  toothNumber: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  treatment: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const visitSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  chiefComplaint: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  dentalRecords: [dentalRecordSchema]
}, { timestamps: true });

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  mobileNumber: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  elphiePatientID: {
    type: String,
    default: null,
    trim: true
  },
  visits: [visitSchema]
}, {
  timestamps: true
});

// Virtual for last visit
patientSchema.virtual('lastVisit').get(function() {
  if (this.visits && this.visits.length > 0) {
    return this.visits[this.visits.length - 1];
  }
  return null;
});

export default mongoose.model('Patient', patientSchema);
