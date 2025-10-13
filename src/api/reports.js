const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { format } = require('fast-csv');
const { openDb } = require('../database');
const { hasRole } = require('../middleware/auth');

// Protect all routes in this file
router.use(hasRole(['admin', 'tech']));

// GET /api/reports/tickets/csv - Download tickets as CSV
router.get('/tickets/csv', async (req, res) => {
    try {
        const db = await openDb();
        const tickets = await db.all(`SELECT id, title, description, category, priority, status, dateCreated, lastUpdated FROM tickets ORDER BY lastUpdated DESC`);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

        tickets.forEach(ticket => {
            csvStream.write(ticket);
        });

        csvStream.end();
    } catch (err) {
        console.error('Error generating tickets CSV:', err);
        res.status(500).json({ message: 'Failed to generate CSV.' });
    }
});

// GET /api/reports/tickets/pdf - Download tickets as PDF
router.get('/tickets/pdf', async (req, res) => {
    try {
        const db = await openDb();
        const tickets = await db.all(`SELECT id, title, description, category, priority, status, dateCreated, lastUpdated FROM tickets ORDER BY lastUpdated DESC`);

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="tickets.pdf"');

        doc.pipe(res);

        // Add header
        doc.fontSize(20).text('Ticket Report', { align: 'center' });
        doc.moveDown();

        // Add tickets
        tickets.forEach(ticket => {
            doc.fontSize(14).text(`Ticket #${ticket.id}: ${ticket.title}`, { underline: true });
            doc.fontSize(10).text(`Status: ${ticket.status} | Priority: ${ticket.priority}`);
            doc.fontSize(10).text(`Category: ${ticket.category}`);
            doc.fontSize(10).text(`Created: ${new Date(ticket.dateCreated).toLocaleString()}`);
            doc.moveDown();
            doc.fontSize(12).text(ticket.description);
            doc.moveDown(2);
        });

        doc.end();
    } catch (err) {
        console.error('Error generating tickets PDF:', err);
        res.status(500).json({ message: 'Failed to generate PDF.' });
    }
});

module.exports = router;
