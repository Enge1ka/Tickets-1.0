const express = require('express');
const router = express.Router();
const { openDb, ticketStatuses, calculateSLADueDate, isSLAViolated } = require('../database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Helper function to get tickets with all necessary joins
async function getTickets(isArchived, user) {
    const db = await openDb();
    const { role, id: userId } = user;

    let query = `
        SELECT
            t.id, t.title, t.description, t.category, t.priority, t.status,
            t.dateCreated, t.lastUpdated, t.assignedTo, t.userId, t.dueDate,
            t.resolutionDate, t.slaViolated, t.escalationLevel, t.tags,
            u.username as userName,
            d.name as departmentName,
            assignedUser.username as assignedToName
        FROM tickets t
        LEFT JOIN users u ON t.userId = u.id
        LEFT JOIN users assignedUser ON t.assignedTo = assignedUser.id
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

    query += ' ORDER BY t.priority DESC, t.dateCreated ASC';

    const tickets = await db.all(query, params);
    
    // Check and update SLA violations
    for (let ticket of tickets) {
        if (ticket.dueDate && !ticket.slaViolated && isSLAViolated(ticket.dueDate)) {
            await db.run('UPDATE tickets SET slaViolated = 1 WHERE id = ?', ticket.id);
            ticket.slaViolated = 1;
        }
    }

    return tickets;
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
    const { title, description, category, priority, tags } = req.body;
    const { id: userId } = req.session.user;

    if (!title || !description || !category || !priority) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const now = new Date().toISOString();
    const dueDate = calculateSLADueDate(priority, now);

    const sql = `
        INSERT INTO tickets (title, description, category, priority, status, dateCreated, lastUpdated, userId, dueDate, tags)
        VALUES (?, ?, ?, ?, 'Open', ?, ?, ?, ?, ?)
    `;
    const params = [title, description, category, priority, now, now, userId, dueDate, tags || ''];

    try {
        const db = await openDb();
        const result = await db.run(sql, params);
        
        // Log ticket creation in history
        await db.run(`
            INSERT INTO ticket_history (ticketId, userId, action, newValue, dateCreated)
            VALUES (?, ?, 'created', 'Ticket created', ?)
        `, [result.lastID, userId, now]);

        const newTicket = await db.get(`
            SELECT t.*, u.username as userName, d.name as departmentName
            FROM tickets t
            LEFT JOIN users u ON t.userId = u.id
            LEFT JOIN departments d ON u.departmentId = d.id
            WHERE t.id = ?
        `, result.lastID);
        
        res.status(201).json(newTicket);
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ message: 'Failed to create ticket.' });
    }
});

// PUT /api/tickets/:id - Update a ticket
router.put('/:id', hasRole(['admin', 'tech']), async (req, res) => {
    const { id } = req.params;
    const { status, assignedTo, tags } = req.body;
    const { id: userId } = req.session.user;

    if (!status && !assignedTo && !tags) {
        return res.status(400).json({ message: 'At least one field (status, assignedTo, tags) is required for update.' });
    }

    try {
        const db = await openDb();
        
        // Get current ticket for history tracking
        const currentTicket = await db.get('SELECT * FROM tickets WHERE id = ?', id);
        if (!currentTicket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const now = new Date().toISOString();
        let updateFields = [];
        let updateParams = [];
        
        if (status) {
            updateFields.push('status = ?');
            updateParams.push(status);
            
            // Log status change
            await db.run(`
                INSERT INTO ticket_history (ticketId, userId, action, oldValue, newValue, dateCreated)
                VALUES (?, ?, 'status_changed', ?, ?, ?)
            `, [id, userId, currentTicket.status, status, now]);
            
            // Set resolution date if ticket is being resolved
            if (status === 'Resolved' || status === 'Closed') {
                updateFields.push('resolutionDate = ?');
                updateParams.push(now);
            }
        }
        
        if (assignedTo !== undefined) {
            updateFields.push('assignedTo = ?');
            updateParams.push(assignedTo);
            
            // Log assignment change
            await db.run(`
                INSERT INTO ticket_history (ticketId, userId, action, oldValue, newValue, dateCreated)
                VALUES (?, ?, 'assigned', ?, ?, ?)
            `, [id, userId, currentTicket.assignedTo, assignedTo, now]);
        }
        
        if (tags !== undefined) {
            updateFields.push('tags = ?');
            updateParams.push(tags);
        }

        updateFields.push('lastUpdated = ?');
        updateParams.push(now);
        updateParams.push(id);

        const sql = `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = ?`;
        const result = await db.run(sql, updateParams);
        
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        // Get updated ticket with user info
        const updatedTicket = await db.get(`
            SELECT t.*, u.username as userName, assignedUser.username as assignedToName
            FROM tickets t
            LEFT JOIN users u ON t.userId = u.id
            LEFT JOIN users assignedUser ON t.assignedTo = assignedUser.id
            WHERE t.id = ?
        `, id);
        
        res.json(updatedTicket);
    } catch (err) {
        console.error('Error updating ticket:', err);
        res.status(500).json({ message: 'Failed to update ticket.' });
    }
});

// GET /api/tickets/:id/comments - Get comments for a ticket
router.get('/:id/comments', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { role } = req.session.user;

    try {
        const db = await openDb();
        
        // Users can only see public comments, admins/techs can see all
        const isInternalFilter = role === 'user' ? 'AND tc.isInternal = 0' : '';
        
        const comments = await db.all(`
            SELECT tc.*, u.username, u.role
            FROM ticket_comments tc
            JOIN users u ON tc.userId = u.id
            WHERE tc.ticketId = ? ${isInternalFilter}
            ORDER BY tc.dateCreated ASC
        `, id);
        
        res.json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ message: 'Failed to fetch comments.' });
    }
});

// POST /api/tickets/:id/comments - Add a comment to a ticket
router.post('/:id/comments', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { comment, isInternal } = req.body;
    const { id: userId, role } = req.session.user;

    if (!comment || comment.trim() === '') {
        return res.status(400).json({ message: 'Comment cannot be empty.' });
    }

    // Only admins and techs can create internal comments
    const internal = (role === 'admin' || role === 'tech') && isInternal ? 1 : 0;

    try {
        const db = await openDb();
        
        // Verify ticket exists
        const ticket = await db.get('SELECT id FROM tickets WHERE id = ?', id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        const now = new Date().toISOString();
        
        const result = await db.run(`
            INSERT INTO ticket_comments (ticketId, userId, comment, isInternal, dateCreated)
            VALUES (?, ?, ?, ?, ?)
        `, [id, userId, comment.trim(), internal, now]);

        // Update ticket's last updated time
        await db.run('UPDATE tickets SET lastUpdated = ? WHERE id = ?', [now, id]);

        // Log comment addition
        await db.run(`
            INSERT INTO ticket_history (ticketId, userId, action, newValue, dateCreated)
            VALUES (?, ?, 'comment_added', ?, ?)
        `, [id, userId, internal ? 'Internal comment added' : 'Comment added', now]);

        // Get the new comment with user info
        const newComment = await db.get(`
            SELECT tc.*, u.username, u.role
            FROM ticket_comments tc
            JOIN users u ON tc.userId = u.id
            WHERE tc.id = ?
        `, result.lastID);

        res.status(201).json(newComment);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ message: 'Failed to add comment.' });
    }
});

module.exports = router;
