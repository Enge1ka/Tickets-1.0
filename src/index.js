const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// Session Middleware
// NOTE: In a production environment, use a proper session store, not the memory store.
app.use(session({
    secret: 'a-very-secret-key-that-should-be-in-env-vars', // In production, use an environment variable
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // In production, set this to true and use HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
const authRoutes = require('./api/auth');
app.use('/api/auth', authRoutes);

const ticketRoutes = require('./api/tickets');
app.use('/api/tickets', ticketRoutes);

const requisitionRoutes = require('./api/requisitions');
app.use('/api/requisitions', requisitionRoutes);

const reportRoutes = require('./api/reports');
app.use('/api/reports', reportRoutes);

const userRoutes = require('./api/users');
app.use('/api/users', userRoutes);

const departmentRoutes = require('./api/departments');
app.use('/api/departments', departmentRoutes);

const backupRoutes = require('./api/backup');
app.use('/api/backup', backupRoutes);

// Simple route to confirm the server is running
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Ticketing & Requisition API!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
