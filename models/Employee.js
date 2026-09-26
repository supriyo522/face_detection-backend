const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  email: { type: String },
  department: { type: String },
  // face-api.js returns a 128-length float descriptor per face
  faceDescriptor: {
    type: [Number],
    required: true,
    validate: {
      validator: (arr) => arr.length === 128,
      message: 'faceDescriptor must have exactly 128 values',
    },
  },
  photoUrl: { type: String }, // optional reference image (base64 or file path)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Employee', employeeSchema);
