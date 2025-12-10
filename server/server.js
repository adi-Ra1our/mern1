require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./utils/db');
const studentRoutes = require('./routes/students');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug Route
app.get('/ping', (req, res) => res.send('pong'));

// Simple request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// API Routes
app.use('/api/students', studentRoutes);

// Serve frontend build (production)
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientPath));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// GLOBAL ERROR HANDLER (must be last)
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({ error: 'Server crashed', details: err.message });
});

const PORT = process.env.PORT || 5000;

// Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
