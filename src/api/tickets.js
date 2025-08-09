const express = require('express');
const router = express.Router();
const { openDb, ticketStatuses } = require('../database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Helper function to get tickets with all necessary joins
async function getTickets(isArchived, user) {
    const db = await openDb();
    const { role, id: userId } = user;

    let query = `
        SELECT
            t.id, t.title, t.description, t.category, t.priority, t.status,
            t.dateCreated, t.lastUpdated, t.assignedTo, t.userId,
            u.username as userName,
            d.name as departmentName
        FROM tickets t
        LEFT JOIN users u ON t.userId = u.id
        LEFT JOIN departments d ON u.departmentId = d.id
    `;

    let conditions = [];
    let params = [];
    const closedStatuses = ticketStatuses.closed;

    if (isArchived) {
        conditions.push(`t.status IN (${closedStatuses.map(() => '?').join(',')})`);
        params.push(...closedStatuses);
    } else {
        conditions.push(`t.status NOT IN (${closedStatuses.map(() => '?').join(',')})`);
        params.push(...closedStatuses);
    }

    if (role === 'user') {
        conditions.push('t.userId = ?');
        params.push(userId);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.lastUpdated DESC';

    return db.all(query, params);
}

// GET /api/tickets - Get ACTIVE tickets
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const tickets = await getTickets(false, req.session.user);
        res.json(tickets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to retrieve tickets.' });
    }
});

// GET /api/tickets/archived - Get ARCHIVED tickets
router.get('/archived', isAuthenticated, async (req, res) => {
    try {
        const tickets = await getTickets(true, req.session.user);
        res.json(tickets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to retrieve archived tickets.' });
    }
});

// POST /api/tickets - Create a new ticket
router.post('/', isAuthenticated, async (req, res) => {
    const { title, description, category, priority } = req.body;
    const { id: userId } = req.session.user;

    if (!title || !description || !category || !priority) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = `
        INSERT INTO tickets (title, description, category, priority, status, dateCreated, lastUpdated, userId)
        VALUES (?, ?, ?, ?, 'Open', ?, ?, ?)
    `;
    const now = new Date().toISOString();
    const params = [title, description, category, priority, now, now, userId];

    try {
        const db = await openDb();
        const result = await db.run(sql, params);
        const newTicket = await db.get('SELECT * FROM tickets WHERE id = ?', result.lastID);
        res.status(201).json(newTicket);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create ticket.' });
    }
});

// PUT /api/tickets/:id - Update a ticket
router.put('/:id', hasRole(['admin', 'tech']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Simplified for workflow

    if (!status) {
        return res.status(400).json({ message: 'Status field is required for update.'})
    }

    const sql = 'UPDATE tickets SET status = ?, lastUpdated = ? WHERE id = ?';
    const params = [status, new Date().toISOString(), id];

    try {
        const db = await openDb();
        const result = await db.run(sql, params);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.json({ id: parseInt(id), status });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update ticket.' });
    }
});

module.exports = router;
