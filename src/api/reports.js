const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { format } = require('fast-csv');
const { tickets, requisitions } = require('../database');

// GET /api/reports/tickets/csv - Download tickets as CSV
router.get('/tickets/csv', (req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    tickets.forEach(ticket => {
        csvStream.write(ticket);
    });

    csvStream.end();
});

// GET /api/reports/tickets/pdf - Download tickets as PDF
router.get('/tickets/pdf', (req, res) => {
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
});

module.exports = router;
