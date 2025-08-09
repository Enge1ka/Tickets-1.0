const express = require('express');
const router = express.Router();
const db = require('../database');
const { hasRole } = require('../middleware/auth');

// Protect this route - only admins can create backups
router.get('/', hasRole(['admin']), (req, res) => {
    const backupData = {
        users: db.users,
        departments: db.departments,
        tickets: db.tickets,
        requisitions: db.requisitions,
        timestamp: new Date().toISOString()
    };

    const fileName = `backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backupData, null, 2)); // Pretty-print the JSON
});

module.exports = router;
