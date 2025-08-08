const express = require('express');
const router = express.Router();
const { requisitions, getNextRequisitionId } = require('../database');

// GET /api/requisitions - Get all requisitions
router.get('/', (req, res) => {
    res.json(requisitions);
});

// POST /api/requisitions - Create a new requisition
router.post('/', (req, res) => {
    const { itemRequested, quantity, reason, urgencyLevel } = req.body;

    if (!itemRequested || !quantity || !reason || !urgencyLevel) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const newRequisition = {
        id: getNextRequisitionId(),
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
router.put('/:id', (req, res) => {
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
