const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// Enroll a new employee with their face descriptor
router.post('/enroll', async (req, res) => {
  try {
    const { name, employeeId, email, department, faceDescriptor, photoUrl } = req.body;

    if (!faceDescriptor || faceDescriptor.length !== 128) {
      return res.status(400).json({ error: 'Valid 128-length faceDescriptor is required' });
    }

    const existing = await Employee.findOne({ employeeId });
    if (existing) {
      return res.status(409).json({ error: 'Employee ID already enrolled' });
    }

    const employee = await Employee.create({
      name,
      employeeId,
      email,
      department,
      faceDescriptor,
      photoUrl,
    });

    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all employees (with descriptors, needed by the client for matching)
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
