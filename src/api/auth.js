const express = require('express');
const router = express.Router();
const { users } = require('../database');

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Store user in session, omitting password
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out, please try again.' });
        }
        res.clearCookie('connect.sid'); // The default session cookie name
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

// GET /api/auth/session - Get current session info
router.get('/session', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

module.exports = router;
