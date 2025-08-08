const express = require('express');
const router = express.Router();
const { tickets, getNextTicketId, users, departments } = require('../database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Helper function to enrich ticket data with user and department info
const enrichTicket = (ticket) => {
    const user = users.find(u => u.id === ticket.userId);
    const department = departments.find(d => d.id === (user ? user.departmentId : null));
    return {
        ...ticket,
        userName: user ? user.username : 'Unknown User',
        departmentName: department ? department.name : 'Unknown Department'
    };
};

// GET /api/tickets - Get tickets based on user role
router.get('/', isAuthenticated, (req, res) => {
    const { role, id } = req.session.user;

    let ticketsToReturn;

    if (role === 'admin' || role === 'tech') {
        ticketsToReturn = tickets; // Admins and techs see all tickets
    } else {
        ticketsToReturn = tickets.filter(t => t.userId === id); // Regular users see only their own tickets
    }

    const enrichedTickets = ticketsToReturn.map(enrichTicket);
    res.json(enrichedTickets);
});

// POST /api/tickets - Create a new ticket
router.post('/', isAuthenticated, (req, res) => {
    const { title, description, category, priority } = req.body;
    const { id: userId } = req.session.user;

    if (!title || !description || !category || !priority) {
        return res.status(400).json({ message: 'Missing required fields: title, description, category, priority' });
    }

    const newTicket = {
        id: getNextTicketId(),
        userId,
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

// PUT /api/tickets/:id - Update a ticket (for admin/tech)
router.put('/:id', hasRole(['admin', 'tech']), (req, res) => {
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
