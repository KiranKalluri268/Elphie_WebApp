import mongoose from 'mongoose';

const clinicSchema = new mongoose.Schema({
  clinicName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zip: {
      type: String,
      required: true,
      trim: true
    }
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  clinicLicenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Clinic', clinicSchema);
