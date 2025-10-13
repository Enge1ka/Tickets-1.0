const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

// Centralized definition of ticket workflow statuses used across the app.
// "closed" statuses are considered archived by the API.
const ticketStatuses = {
    open: [
        'Open',
        'In Progress',
        'Awaiting User Response',
        'Awaiting Parts',
        'Pending Confirmation'
    ],
    closed: ['Resolved']
};

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

    // Use serialize to ensure statements run in order
    await db.serialize(async () => {
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
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                dateCreated TEXT NOT NULL,
                lastUpdated TEXT NOT NULL,
                assignedTo TEXT,
                userId INTEGER,
                FOREIGN KEY (userId) REFERENCES users (id)
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

        // Seed initial data if tables are empty
        const depts = await db.get('SELECT COUNT(id) as count FROM departments');
        if (depts.count === 0) {
            await db.run("INSERT INTO departments (name) VALUES ('IT Support'), ('Human Resources'), ('Sales')");
        }

        const users = await db.get('SELECT COUNT(id) as count FROM users');
        if (users.count === 0) {
            // Note: Passwords are in plaintext. In a real app, they should be hashed.
            await db.run("INSERT INTO users (username, password, role, departmentId) VALUES ('admin', 'password', 'admin', 1), ('tech', 'password', 'tech', 1), ('user', 'password', 'user', 2)");
        }
    });

    console.log('Database initialized successfully.');
    // db.close(); // We might want to keep the connection open or manage it differently
}

module.exports = { openDb, initializeDatabase, ticketStatuses };
