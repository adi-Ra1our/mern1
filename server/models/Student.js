// server/models/Student.js
const mongoose = require('mongoose');

// If a Student model was previously compiled in this process, remove it.
// This avoids schema/validation mismatches when nodemon reloads files.
if (mongoose.models && mongoose.models.Student) {
  delete mongoose.models.Student;
  delete mongoose.modelSchemas.Student;
}

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },

  co1: { type: Number, required: true },
  co2: { type: Number, required: true },
  co3: { type: Number, required: true },

  // Computed fields (NOT required)
  totalMarks: { type: Number, required: false },
  percentage: { type: Number, required: false },
  avg: { type: Number, required: false },

  createdAt: { type: Date, default: Date.now }
});

// Compute fields before saving
StudentSchema.pre('save', function (next) {
  this.totalMarks = this.co1 + this.co2 + this.co3;
  this.percentage = this.totalMarks / 3;
  this.avg = this.percentage;
  next();
});

module.exports = mongoose.model('Student', StudentSchema);
