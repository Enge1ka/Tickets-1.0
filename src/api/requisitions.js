const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

const closedStatuses = ['Fulfilled', 'Declined'];

// Helper to get requisitions based on status and user
async function getRequisitions(isArchived, user) {
    const db = await openDb();
    const { role, id: userId } = user;

    let query = 'SELECT * FROM requisitions';
    let params = [];
    let conditions = [];

    if (isArchived) {
        conditions.push(`status IN (${closedStatuses.map(() => '?').join(',')})`);
        params.push(...closedStatuses);
    } else {
        conditions.push(`status NOT IN (${closedStatuses.map(() => '?').join(',')})`);
        params.push(...closedStatuses);
    }

    if (role === 'user') {
        conditions.push('userId = ?');
        params.push(userId);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    return db.all(query, params);
}


// GET /api/requisitions - Get ACTIVE requisitions based on user role
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const requisitions = await getRequisitions(false, req.session.user);
        res.json(requisitions);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve requisitions.' });
    }
});

// GET /api/requisitions/archived - Get ARCHIVED requisitions based on user role
router.get('/archived', isAuthenticated, async (req, res) => {
    try {
        const requisitions = await getRequisitions(true, req.session.user);
        res.json(requisitions);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve archived requisitions.' });
    }
});

// POST /api/requisitions - Create a new requisition
router.post('/', isAuthenticated, async (req, res) => {
    const { itemRequested, quantity, reason, urgencyLevel } = req.body;
    const { id: userId } = req.session.user;

    if (!itemRequested || !quantity || !reason || !urgencyLevel) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = `INSERT INTO requisitions (itemRequested, quantity, reason, urgencyLevel, status, dateCreated, userId)
                 VALUES (?, ?, ?, ?, 'Pending', ?, ?)`;
    const params = [itemRequested, quantity, reason, urgencyLevel, new Date().toISOString(), userId];

    try {
        const db = await openDb();
        const result = await db.run(sql, params);
        res.status(201).json({ id: result.lastID, ...req.body, userId, status: 'Pending' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create requisition.' });
    }
});

// PUT /api/requisitions/:id - Update a requisition (for admin)
router.put('/:id', hasRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const db = await openDb();
        const result = await db.run('UPDATE requisitions SET status = ? WHERE id = ?', [status, id]);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Requisition not found' });
        }
        res.json({ id: parseInt(id), status });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update requisition.' });
    }
});

module.exports = router;
