const express = require('express');
const router = express.Router();
const { openDb } = require('../database');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const db = await openDb();
        // In a real app, passwords would be hashed and compared securely.
        const user = await db.get('SELECT id, username, role FROM users WHERE username = ? AND password = ?', [username, password]);

        if (user) {
            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role
            };
            res.json(req.session.user);
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out, please try again.' });
        }
        res.clearCookie('connect.sid');
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
