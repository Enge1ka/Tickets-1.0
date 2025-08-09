const express = require('express');
const router = express.Router();
const { requisitions, getNextRequisitionId } = require('../database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

const closedStatuses = ['Fulfilled', 'Declined'];

// GET /api/requisitions - Get ACTIVE requisitions based on user role
router.get('/', isAuthenticated, (req, res) => {
    const { role, id } = req.session.user;

    let requisitionsToReturn;

    if (role === 'admin' || role === 'tech') {
        requisitionsToReturn = requisitions.filter(r => !closedStatuses.includes(r.status));
    } else {
        requisitionsToReturn = requisitions.filter(r => r.userId === id && !closedStatuses.includes(r.status));
    }
    res.json(requisitionsToReturn);
});

// GET /api/requisitions/archived - Get ARCHIVED requisitions based on user role
router.get('/archived', isAuthenticated, (req, res) => {
    const { role, id } = req.session.user;

    let requisitionsToReturn;

    if (role === 'admin' || role === 'tech') {
        requisitionsToReturn = requisitions.filter(r => closedStatuses.includes(r.status));
    } else {
        requisitionsToReturn = requisitions.filter(r => r.userId === id && closedStatuses.includes(r.status));
    }
    res.json(requisitionsToReturn);
});

// POST /api/requisitions - Create a new requisition
router.post('/', isAuthenticated, (req, res) => {
    const { itemRequested, quantity, reason, urgencyLevel } = req.body;
    const { id: userId } = req.session.user;

    if (!itemRequested || !quantity || !reason || !urgencyLevel) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const newRequisition = {
        id: getNextRequisitionId(),
        userId,
        itemRequested,
        quantity: parseInt(quantity, 10),
        reason,
        urgencyLevel,
        status: 'Pending',
        dateCreated: new Date().toISOString()
    };

    requisitions.push(newRequisition);
    res.status(201).json(newRequisition);
});

// PUT /api/requisitions/:id - Update a requisition (for admin)
router.put('/:id', hasRole(['admin']), (req, res) => {
    const requisitionId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const requisition = requisitions.find(r => r.id === requisitionId);

    if (!requisition) {
        return res.status(404).json({ message: 'Requisition not found' });
    }

    if (status) requisition.status = status;

    res.json(requisition);
});

module.exports = router;
