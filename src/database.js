const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

// Determine the correct path for the database file.
// In development, it will be in the project root.
// In a packaged executable, it will be next to the .exe file.
const isPkg = typeof process.pkg !== 'undefined';
const dbPath = isPkg
  ? path.join(path.dirname(process.execPath), 'database.db')
  : path.join(__dirname, '..', 'database.db');


// This function will open a connection to the database file.
async function openDb() {
    return open({
        filename: dbPath,
        driver: sqlite3.Database
    });
}

// This function initializes the database, creating tables and seeding initial data.
async function initializeDatabase() {
    const db = await openDb();

    // Create tables and seed data
        // Create tables if they don't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'tech', 'user')),
                departmentId INTEGER,
                FOREIGN KEY (departmentId) REFERENCES departments (id)
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                priority TEXT NOT NULL CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')),
                status TEXT NOT NULL CHECK(status IN ('Open', 'In Progress', 'Pending Confirmation', 'Resolved', 'Closed', 'Awaiting User Response', 'Awaiting Parts')),
                dateCreated TEXT NOT NULL,
                lastUpdated TEXT NOT NULL,
                assignedTo INTEGER,
                userId INTEGER,
                dueDate TEXT,
                resolutionDate TEXT,
                slaViolated INTEGER DEFAULT 0,
                escalationLevel INTEGER DEFAULT 0,
                tags TEXT,
                FOREIGN KEY (userId) REFERENCES users (id),
                FOREIGN KEY (assignedTo) REFERENCES users (id)
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS requisitions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                itemRequested TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                reason TEXT NOT NULL,
                urgencyLevel TEXT NOT NULL,
                status TEXT NOT NULL,
                dateCreated TEXT NOT NULL,
                userId INTEGER,
                FOREIGN KEY (userId) REFERENCES users (id)
            );
        `);

        // New tables for enhanced help desk functionality
        await db.exec(`
            CREATE TABLE IF NOT EXISTS ticket_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticketId INTEGER NOT NULL,
                userId INTEGER NOT NULL,
                comment TEXT NOT NULL,
                isInternal INTEGER DEFAULT 0,
                dateCreated TEXT NOT NULL,
                FOREIGN KEY (ticketId) REFERENCES tickets (id) ON DELETE CASCADE,
                FOREIGN KEY (userId) REFERENCES users (id)
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS ticket_attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticketId INTEGER NOT NULL,
                fileName TEXT NOT NULL,
                originalName TEXT NOT NULL,
                fileSize INTEGER NOT NULL,
                mimeType TEXT NOT NULL,
                uploadedBy INTEGER NOT NULL,
                dateUploaded TEXT NOT NULL,
                FOREIGN KEY (ticketId) REFERENCES tickets (id) ON DELETE CASCADE,
                FOREIGN KEY (uploadedBy) REFERENCES users (id)
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT NOT NULL,
                tags TEXT,
                createdBy INTEGER NOT NULL,
                dateCreated TEXT NOT NULL,
                lastUpdated TEXT NOT NULL,
                isPublic INTEGER DEFAULT 1,
                viewCount INTEGER DEFAULT 0,
                FOREIGN KEY (createdBy) REFERENCES users (id)
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS sla_policies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                priority TEXT NOT NULL,
                responseTimeHours INTEGER NOT NULL,
                resolutionTimeHours INTEGER NOT NULL,
                isActive INTEGER DEFAULT 1
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS ticket_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticketId INTEGER NOT NULL,
                userId INTEGER NOT NULL,
                action TEXT NOT NULL,
                oldValue TEXT,
                newValue TEXT,
                dateCreated TEXT NOT NULL,
                FOREIGN KEY (ticketId) REFERENCES tickets (id) ON DELETE CASCADE,
                FOREIGN KEY (userId) REFERENCES users (id)
            );
        `);

        // Seed initial data if tables are empty
        const depts = await db.get('SELECT COUNT(id) as count FROM departments');
        if (depts.count === 0) {
            await db.run("INSERT INTO departments (name) VALUES ('IT Support'), ('Human Resources'), ('Sales')");
        }

        const users = await db.get('SELECT COUNT(id) as count FROM users');
        if (users.count === 0) {
            // Note: Passwords are in plaintext. In a real app, they should be hashed.
            await db.run("INSERT INTO users (username, password, role, departmentId) VALUES ('admin', 'password', 'admin', 1), ('tech', 'password', 'tech', 1), ('user', 'password', 'user', 2), ('tech2', 'password', 'tech', 1)");
        }

        // Seed SLA policies
        const slaCount = await db.get('SELECT COUNT(id) as count FROM sla_policies');
        if (slaCount.count === 0) {
            await db.run(`
                INSERT INTO sla_policies (name, priority, responseTimeHours, resolutionTimeHours, isActive) VALUES 
                ('Critical Priority SLA', 'Critical', 1, 4, 1),
                ('High Priority SLA', 'High', 4, 24, 1),
                ('Medium Priority SLA', 'Medium', 8, 72, 1),
                ('Low Priority SLA', 'Low', 24, 168, 1)
            `);
        }

        // Seed some knowledge base articles
        const kbCount = await db.get('SELECT COUNT(id) as count FROM knowledge_base');
        if (kbCount.count === 0) {
            const now = new Date().toISOString();
            await db.run(`
                INSERT INTO knowledge_base (title, content, category, tags, createdBy, dateCreated, lastUpdated, isPublic) VALUES 
                ('Password Reset Instructions', 'To reset your password: 1. Go to login page 2. Click "Forgot Password" 3. Enter your email 4. Check your email for reset link', 'Account Management', 'password,reset,login', 1, ?, ?, 1),
                ('VPN Connection Issues', 'Common VPN issues: 1. Check internet connection 2. Verify VPN credentials 3. Try different server location 4. Contact IT if issues persist', 'Network', 'vpn,connection,network', 1, ?, ?, 1),
                ('Software Installation Guide', 'For software installation requests: 1. Submit requisition form 2. Wait for approval 3. IT will schedule installation 4. Restart required after installation', 'Software', 'installation,software,requisition', 1, ?, ?, 1)
            `, [now, now, now, now, now, now]);
        }

    console.log('Database initialized successfully.');
    // db.close(); // We might want to keep the connection open or manage it differently
}

// Helper constants for ticket statuses
const ticketStatuses = {
    open: ['Open', 'In Progress', 'Awaiting User Response', 'Awaiting Parts'],
    closed: ['Resolved', 'Closed'],
    all: ['Open', 'In Progress', 'Pending Confirmation', 'Resolved', 'Closed', 'Awaiting User Response', 'Awaiting Parts']
};

// Helper function to calculate SLA due date
function calculateSLADueDate(priority, createdDate) {
    const slaHours = {
        'Critical': 4,
        'High': 24,
        'Medium': 72,
        'Low': 168
    };
    
    const created = new Date(createdDate);
    const hours = slaHours[priority] || 168; // Default to low priority
    const dueDate = new Date(created.getTime() + (hours * 60 * 60 * 1000));
    return dueDate.toISOString();
}

// Helper function to check if SLA is violated
function isSLAViolated(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    return now > due;
}

module.exports = { 
    openDb, 
    initializeDatabase, 
    ticketStatuses, 
    calculateSLADueDate, 
    isSLAViolated 
};
