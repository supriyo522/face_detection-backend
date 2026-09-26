const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD', one record per employee per day
  status: { type: String, enum: ['Present', 'Absent'], default: 'Absent' },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  confidence: { type: Number }, // match distance score, lower = better match
});

// Ensure one attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
