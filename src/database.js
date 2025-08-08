// In-memory data store
let tickets = [
    {
        id: 1,
        title: 'Email client not working',
        description: 'Outlook is showing a "Cannot connect to server" error since this morning.',
        category: 'Software Issue',
        priority: 'High',
        status: 'Open',
        dateCreated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        lastUpdated: new Date().toISOString(),
        assignedTo: 'tech1'
    },
    {
        id: 2,
        title: 'Cannot print documents',
        description: 'The main office printer on the 2nd floor is not responding.',
        category: 'Hardware Issue',
        priority: 'Medium',
        status: 'In Progress',
        dateCreated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        lastUpdated: new Date().toISOString(),
        assignedTo: 'tech2'
    }
];

let requisitions = [
    {
        id: 1,
        itemRequested: 'Ergonomic Keyboard',
        quantity: 1,
        reason: 'Current keyboard is causing wrist strain.',
        urgencyLevel: 'Medium',
        status: 'Pending',
        dateCreated: new Date().toISOString()
    }
];

// We need a way to ensure IDs are unique
let nextTicketId = tickets.length + 1;
let nextRequisitionId = requisitions.length + 1;

const getNextTicketId = () => nextTicketId++;
const getNextRequisitionId = () => nextRequisitionId++;


module.exports = {
    tickets,
    requisitions,
    getNextTicketId,
    getNextRequisitionId
};
