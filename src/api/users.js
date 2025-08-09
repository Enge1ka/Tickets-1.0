const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const { hasRole } = require('../middleware/auth');

// Protect all routes in this file - only admins can manage users
router.use(hasRole(['admin']));

// GET /api/users - Get all users
router.get('/', async (req, res) => {
    try {
        const db = await openDb();
        // Omit password from the result set for security
        const users = await db.all('SELECT id, username, role, departmentId FROM users ORDER BY username');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve users.' });
    }
});

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
    const { username, password, role, departmentId } = req.body;
    if (!username || !password || !role || !departmentId) {
        return res.status(400).json({ message: 'Missing required fields: username, password, role, departmentId' });
    }

    try {
        const db = await openDb();
        const result = await db.run(
            'INSERT INTO users (username, password, role, departmentId) VALUES (?, ?, ?, ?)',
            [username, password, role, departmentId]
        );
        res.status(201).json({ id: result.lastID, username, role, departmentId });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Failed to create user.' });
    }
});

// PUT /api/users/:id - Update a user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { username, role, departmentId, password } = req.body;

    try {
        const db = await openDb();
        // Build query dynamically based on whether password is being updated
        let query = 'UPDATE users SET username = ?, role = ?, departmentId = ?';
        let params = [username, role, departmentId];

        if (password) {
            query += ', password = ?';
            params.push(password);
        }

        query += ' WHERE id = ?';
        params.push(id);

        const result = await db.run(query, params);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ id: parseInt(id), username, role, departmentId });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Failed to update user.' });
    }
});

module.exports = router;
