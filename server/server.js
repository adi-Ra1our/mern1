// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./utils/db');
const studentRoutes = require('./routes/students');

const app = express();
app.use(cors());
app.use(express.json());// Temporary debug route and error handler
app.get('/ping', (req, res) => res.send('pong'));
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({ error: 'Server crashed', details: err.message });
});

// API routes
// simple logger - add this above the routes
app.use((req, res, next) => { console.log(new Date().toISOString(), req.method, req.url); next(); });
app.use('/api/students', studentRoutes);

// serve client build in production (will be used later)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
