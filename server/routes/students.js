// server/routes/students.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
console.log("Using Student model from:", require.resolve("../models/Student"));


/**
 * GET /api/students
 */
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ roll: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/students
 * body: { name, roll, co1, co2, co3 }
 */
router.post('/', async (req, res) => {
  try {
    const { name, roll, co1, co2, co3 } = req.body;
const student = new Student({
  name,
  rollNumber: roll, // map frontend "roll" -> model "rollNumber"
  co1,
  co2,
  co3
});

    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/students/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/students/attainment
 * body: { threshold: Number, mapping: { co1: {po1: w,...}, ... } }
 */
router.post('/attainment', async (req, res) => {
  try {
    const { threshold = 40, mapping = {} } = req.body;
    const students = await Student.find();
    if (!students.length) return res.status(400).json({ error: 'No students' });

    const coAtt = [1,2,3].map(i => {
      const count = students.filter(s => s['co' + i] >= threshold).length;
      return (count / students.length) * 100;
    });

    const poCount = 3;
    const poAtt = [];
    for (let p = 1; p <= poCount; p++) {
      let weightedSum = 0, weightTotal = 0;
      for (let c = 1; c <= 3; c++) {
        const w = parseFloat((mapping[`co${c}`] && mapping[`co${c}`][`po${p}`]) || 0);
        weightedSum += coAtt[c-1] * w;
        weightTotal += w;
      }
      poAtt.push(weightTotal > 0 ? (weightedSum / weightTotal) : 0);
    }

    res.json({ coAtt, poAtt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
