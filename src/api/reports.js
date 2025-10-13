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
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');

    try {
        const db = await openDb();
        const rows = await db.all(`
            SELECT t.id, t.title, t.description, t.category, t.priority, t.status,
                   t.dateCreated, t.lastUpdated, t.assignedTo,
                   u.username as userName,
                   d.name as departmentName
            FROM tickets t
            LEFT JOIN users u ON t.userId = u.id
            LEFT JOIN departments d ON u.departmentId = d.id
            ORDER BY t.lastUpdated DESC
        `);

        const csvStream = format({ headers: true });
        csvStream.pipe(res);
        rows.forEach(row => csvStream.write(row));
        csvStream.end();
    } catch (err) {
        console.error('CSV generation error:', err);
        res.status(500).json({ message: 'Failed to generate CSV' });
    }
});

// GET /api/reports/tickets/pdf - Download tickets as PDF
router.get('/tickets/pdf', async (req, res) => {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets.pdf"');

    try {
        const db = await openDb();
        const rows = await db.all(`
            SELECT t.id, t.title, t.description, t.category, t.priority, t.status,
                   t.dateCreated, t.lastUpdated, t.assignedTo,
                   u.username as userName,
                   d.name as departmentName
            FROM tickets t
            LEFT JOIN users u ON t.userId = u.id
            LEFT JOIN departments d ON u.departmentId = d.id
            ORDER BY t.lastUpdated DESC
        `);

        doc.pipe(res);
        doc.fontSize(20).text('Ticket Report', { align: 'center' });
        doc.moveDown();

        rows.forEach(ticket => {
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
        console.error('PDF generation error:', err);
        res.status(500).json({ message: 'Failed to generate PDF' });
    }
});

module.exports = router;
