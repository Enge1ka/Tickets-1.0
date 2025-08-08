const express = require('express');
const router = express.Router();
const { departments, getNextDepartmentId } = require('../database');
const { hasRole } = require('../middleware/auth');

// Protect all routes in this file - only admins can manage departments
router.use(hasRole(['admin']));

// GET /api/departments - Get all departments
router.get('/', (req, res) => {
    res.json(departments);
});

// POST /api/departments - Create a new department
router.post('/', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Missing required field: name' });
    }

    if (departments.some(d => d.name.toLowerCase() === name.toLowerCase())) {
        return res.status(409).json({ message: 'Department name already exists' });
    }

    const newDepartment = {
        id: getNextDepartmentId(),
        name
    };

    departments.push(newDepartment);
    res.status(201).json(newDepartment);
});

module.exports = router;
