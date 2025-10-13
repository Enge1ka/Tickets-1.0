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
        const tickets = await db.all(`
            SELECT 
                t.id, t.title, t.description, t.category, t.priority, t.status,
                t.dateCreated, t.lastUpdated, t.assignedTo,
                u.username as userName,
                d.name as departmentName
            FROM tickets t
            LEFT JOIN users u ON t.userId = u.id
            LEFT JOIN departments d ON u.departmentId = d.id
            ORDER BY t.dateCreated DESC
        `);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');

        const csvStream = format({ headers: true });
        csvStream.pipe(res);

        tickets.forEach(ticket => {
            csvStream.write(ticket);
        });

        csvStream.end();
    } catch (err) {
        console.error('CSV export error:', err);
        res.status(500).json({ message: 'Failed to generate CSV report' });
    }
});

// GET /api/reports/tickets/pdf - Download tickets as PDF
router.get('/tickets/pdf', async (req, res) => {
    try {
        const db = await openDb();
        const tickets = await db.all(`
            SELECT 
                t.id, t.title, t.description, t.category, t.priority, t.status,
                t.dateCreated, t.lastUpdated, t.assignedTo,
                u.username as userName,
                d.name as departmentName
            FROM tickets t
            LEFT JOIN users u ON t.userId = u.id
            LEFT JOIN departments d ON u.departmentId = d.id
            ORDER BY t.dateCreated DESC
        `);

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="tickets.pdf"');

        doc.pipe(res);

        // Add header
        doc.fontSize(20).text('Ticket Report', { align: 'center' });
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Add tickets
        tickets.forEach((ticket, index) => {
            if (index > 0) {
                doc.addPage();
            }
            
            doc.fontSize(16).text(`Ticket #${ticket.id}: ${ticket.title}`, { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10).text(`Status: ${ticket.status} | Priority: ${ticket.priority}`);
            doc.fontSize(10).text(`Category: ${ticket.category}`);
            doc.fontSize(10).text(`Submitted by: ${ticket.userName || 'Unknown'} (${ticket.departmentName || 'N/A'})`);
            doc.fontSize(10).text(`Created: ${new Date(ticket.dateCreated).toLocaleString()}`);
            doc.fontSize(10).text(`Last Updated: ${new Date(ticket.lastUpdated).toLocaleString()}`);
            if (ticket.assignedTo) {
                doc.fontSize(10).text(`Assigned To: ${ticket.assignedTo}`);
            }
            doc.moveDown();
            doc.fontSize(11).text('Description:', { underline: true });
            doc.fontSize(10).text(ticket.description);
        });

        doc.end();
    } catch (err) {
        console.error('PDF export error:', err);
        res.status(500).json({ message: 'Failed to generate PDF report' });
    }
});

module.exports = router;
