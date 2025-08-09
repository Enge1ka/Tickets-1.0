const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const { hasRole } = require('../middleware/auth');

// Protect all routes in this file - only admins can manage departments
router.use(hasRole(['admin']));

// GET /api/departments - Get all departments
router.get('/', async (req, res) => {
    try {
        const db = await openDb();
        const departments = await db.all('SELECT * FROM departments ORDER BY name');
        res.json(departments);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve departments.' });
    }
});

// POST /api/departments - Create a new department
router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Missing required field: name' });
    }

    try {
        const db = await openDb();
        const result = await db.run('INSERT INTO departments (name) VALUES (?)', [name]);
        res.status(201).json({ id: result.lastID, name });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: 'Department name already exists' });
        }
        res.status(500).json({ message: 'Failed to create department.' });
    }
});

// PUT /api/departments/:id - Update a department
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Missing required field: name' });
    }

    try {
        const db = await openDb();
        const result = await db.run('UPDATE departments SET name = ? WHERE id = ?', [name, id]);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json({ id: parseInt(id), name });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: 'Department name already exists' });
        }
        res.status(500).json({ message: 'Failed to update department.' });
    }
});

module.exports = router;
