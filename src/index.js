const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
const ticketRoutes = require('./api/tickets');
app.use('/api/tickets', ticketRoutes);

const requisitionRoutes = require('./api/requisitions');
app.use('/api/requisitions', requisitionRoutes);

const reportRoutes = require('./api/reports');
app.use('/api/reports', reportRoutes);

// Simple route to confirm the server is running
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Ticketing & Requisition API!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
