const express = require('express');
const router = express.Router();
const { users, getNextUserId } = require('../database');
const { hasRole } = require('../middleware/auth');

// Protect all routes in this file - only admins can manage users
router.use(hasRole(['admin']));

// GET /api/users - Get all users
router.get('/', (req, res) => {
    // Return users without their passwords for security
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
});

// POST /api/users - Create a new user
router.post('/', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Missing required fields: username, password, role' });
    }

    // Check if username already exists
    if (users.some(u => u.username === username)) {
        return res.status(409).json({ message: 'Username already exists' });
    }

    const newUser = {
        id: getNextUserId(),
        username,
        password, // In a real app, hash this password
        role
    };

    users.push(newUser);

    // Return the new user without the password
    const { password: _, ...sanitizedUser } = newUser;
    res.status(201).json(sanitizedUser);
});

// PUT /api/users/:id - Update a user
router.put('/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { username, role, departmentId, password } = req.body;

    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if they are provided
    if (username) user.username = username;
    if (role) user.role = role;
    if (departmentId) user.departmentId = departmentId;
    if (password) user.password = password; // Reset password. Again, hash in production.

    const { password: __, ...sanitizedUser } = user;
    res.json(sanitizedUser);
});

module.exports = router;
