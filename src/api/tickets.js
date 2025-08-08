const express = require('express');
const router = express.Router();
const { tickets, getNextTicketId } = require('../database');

// GET /api/tickets - Get all tickets
router.get('/', (req, res) => {
    res.json(tickets);
});

// POST /api/tickets - Create a new ticket
router.post('/', (req, res) => {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category || !priority) {
        return res.status(400).json({ message: 'Missing required fields: title, description, category, priority' });
    }

    const newTicket = {
        id: getNextTicketId(),
        title,
        description,
        category,
        priority,
        status: 'Open',
        dateCreated: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        assignedTo: null
    };

    tickets.push(newTicket);
    res.status(201).json(newTicket);
});

// PUT /api/tickets/:id - Update a ticket (for admin)
router.put('/:id', (req, res) => {
    const ticketId = parseInt(req.params.id, 10);
    const { status, priority, assignedTo } = req.body;

    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
    }

    // Update fields if they are provided
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;

    ticket.lastUpdated = new Date().toISOString();

    res.json(ticket);
});

module.exports = router;
