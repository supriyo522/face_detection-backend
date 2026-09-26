const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

function todayStr() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const values = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`; // YYYY-MM-DD in IST
}

function toISTString(date) {
  if (!date) return null;
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// Called by the client once it has matched a live face to an employeeId
router.post('/mark', async (req, res) => {
  try {
    const { employeeId, confidence } = req.body;
    const employee = await Employee.findOne({ employeeId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const date = todayStr();
    let record = await Attendance.findOne({ employee: employee._id, date });

    if (!record) {
      record = await Attendance.create({
        employee: employee._id,
        date,
        status: 'Present',
        checkInTime: new Date(),
        confidence,
      });
    } else {
      // Already checked in today -> update checkout time (last-seen)
      record.checkOutTime = new Date();
      record.status = 'Present';
      await record.save();
    }

    res.json({
      message: `Attendance marked for ${employee.name}`,
      record: {
        ...record.toObject(),
        checkInTime: toISTString(record.checkInTime),
        checkOutTime: toISTString(record.checkOutTime),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get today's attendance, showing Present employees + Absent (everyone else)
router.get('/today', async (req, res) => {
  try {
    const date = todayStr();
    const allEmployees = await Employee.find().select('name employeeId department');
    const records = await Attendance.find({ date }).populate('employee', 'name employeeId');

    const presentIds = new Set(records.map((r) => r.employee._id.toString()));

    const result = allEmployees.map((emp) => {
      const record = records.find((r) => r.employee._id.toString() === emp._id.toString());
      return {
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        status: presentIds.has(emp._id.toString()) ? 'Present' : 'Absent',
        checkInTime: record ? toISTString(record.checkInTime) : null,
        checkOutTime: record ? toISTString(record.checkOutTime) : null,
      };
    });

    res.json({ date, attendance: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance history for one employee
router.get('/history/:employeeId', async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    const records = await Attendance.find({ employee: employee._id }).sort({ date: -1 });
    res.json(
      records.map((record) => ({
        ...record.toObject(),
        checkInTime: toISTString(record.checkInTime),
        checkOutTime: toISTString(record.checkOutTime),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
