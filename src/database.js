// In-memory data store

// Note: Passwords are in plaintext for this prototype. In a real application, they should be hashed.
let departments = [
    { id: 1, name: 'IT Support' },
    { id: 2, name: 'Human Resources' },
    { id: 3, name: 'Sales' }
];

let users = [
    { id: 1, username: 'admin', password: 'password', role: 'admin', departmentId: 1 },
    { id: 2, username: 'tech', password: 'password', role: 'tech', departmentId: 1 },
    { id: 3, username: 'user', password: 'password', role: 'user', departmentId: 2 }
];

let tickets = [
    {
        id: 1,
        userId: 3, // Created by 'user'
        title: 'Email client not working',
        description: 'Outlook is showing a "Cannot connect to server" error since this morning.',
        category: 'Software Issue',
        priority: 'High',
        status: 'Open',
        dateCreated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        lastUpdated: new Date().toISOString(),
        assignedTo: 'tech'
    },
    {
        id: 2,
        userId: 3, // Created by 'user'
        title: 'Cannot print documents',
        description: 'The main office printer on the 2nd floor is not responding.',
        category: 'Hardware Issue',
        priority: 'Medium',
        status: 'In Progress',
        dateCreated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        lastUpdated: new Date().toISOString(),
        assignedTo: 'tech'
    }
];

let requisitions = [
    {
        id: 1,
        userId: 3, // Created by 'user'
        itemRequested: 'Ergonomic Keyboard',
        quantity: 1,
        reason: 'Current keyboard is causing wrist strain.',
        urgencyLevel: 'Medium',
        status: 'Pending',
        dateCreated: new Date().toISOString()
    }
];

// ID Counters
let nextDepartmentId = departments.length + 1;
let nextUserId = users.length + 1;
let nextTicketId = tickets.length + 1;
let nextRequisitionId = requisitions.length + 1;

const getNextDepartmentId = () => nextDepartmentId++;
const getNextUserId = () => nextUserId++;
const getNextTicketId = () => nextTicketId++;
const getNextRequisitionId = () => nextRequisitionId++;


module.exports = {
    departments,
    users,
    tickets,
    requisitions,
    getNextDepartmentId,
    getNextUserId,
    getNextTicketId,
    getNextRequisitionId
};
