# Help Desk Ticketing System

A comprehensive web-based help desk ticketing and requisition management system built with Node.js, Express, and SQLite. This system allows users to submit IT support tickets, track their status, and submit requisitions for equipment and resources.

## Features

### User Features
- **Submit Support Tickets**: Log IT issues with categories (Software, Hardware, Network, Other) and priority levels
- **Track Ticket Status**: View active tickets and ticket history
- **Submit Requisitions**: Request equipment, supplies, or resources
- **View Requisition Status**: Track approval and fulfillment of requests

### Admin/Tech Features
- **Dashboard**: Comprehensive view of all tickets and requisitions
- **Ticket Management**: Update ticket statuses, assign tickets, and track progress
- **Requisition Management**: Approve, decline, or fulfill requisition requests
- **User Management**: Create, edit, and manage user accounts
- **Department Management**: Manage organizational departments
- **Reports**: Generate CSV and PDF reports of tickets
- **Archive**: View historical data for resolved tickets and completed requisitions
- **Real-time Notifications**: Desktop notifications and sound alerts for new tickets

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite3
- **Frontend**: HTML, CSS (Bootstrap 5), Vanilla JavaScript
- **Session Management**: express-session
- **PDF Generation**: PDFKit
- **CSV Export**: fast-csv

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Setup Instructions

1. **Clone or navigate to the project directory**:
   ```bash
   cd /path/to/ticketing-requisition-service
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## Default Credentials

The system comes with three pre-configured users:

| Username | Password | Role  | Description |
|----------|----------|-------|-------------|
| admin    | password | admin | Full system access, user management |
| tech     | password | tech  | Can manage tickets and view reports |
| user     | password | user  | Can submit tickets and requisitions |

**⚠️ IMPORTANT**: Change these default passwords in a production environment!

## User Roles

### User
- Submit IT support tickets
- View own tickets and their status
- Confirm ticket resolution
- Submit requisitions
- View own requisitions

### Tech
- All user permissions
- View and manage all tickets
- Update ticket statuses with additional options
- Generate reports
- View archive

### Admin
- All tech permissions
- Manage user accounts
- Manage departments
- Manage all requisitions
- Full system access

## Application Structure

```
ticketing-requisition-service/
├── src/
│   ├── api/
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── tickets.js        # Ticket management endpoints
│   │   ├── requisitions.js   # Requisition management endpoints
│   │   ├── users.js          # User management endpoints
│   │   ├── departments.js    # Department management endpoints
│   │   └── reports.js        # Report generation endpoints
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   ├── database.js           # Database setup and configuration
│   └── index.js              # Main application entry point
├── public/
│   ├── admin/                # Admin panel pages
│   │   ├── dashboard.html    # Main admin dashboard
│   │   ├── users.html        # User management
│   │   ├── settings.html     # Department settings
│   │   ├── reports.html      # Report generation
│   │   └── archive.html      # Historical data
│   ├── index.html            # User main page
│   ├── login.html            # Login page
│   └── style.css             # Custom styles
├── database.db               # SQLite database (created on first run)
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session info

### Tickets
- `GET /api/tickets` - Get active tickets (filtered by role)
- `GET /api/tickets/archived` - Get resolved tickets
- `POST /api/tickets` - Create a new ticket
- `PUT /api/tickets/:id` - Update ticket status (admin/tech only)

### Requisitions
- `GET /api/requisitions` - Get active requisitions (filtered by role)
- `GET /api/requisitions/archived` - Get completed requisitions
- `POST /api/requisitions` - Create a new requisition
- `PUT /api/requisitions/:id` - Update requisition status (admin only)

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user

### Departments (Admin only)
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create a new department
- `PUT /api/departments/:id` - Update a department

### Reports (Admin/Tech only)
- `GET /api/reports/tickets/csv` - Download tickets as CSV
- `GET /api/reports/tickets/pdf` - Download tickets as PDF

## Ticket Workflow

1. **User submits a ticket** → Status: `Open`
2. **Tech picks up ticket** → Status: `In Progress`
3. **Tech may update status based on situation**:
   - `Awaiting User Response` - Waiting for user feedback
   - `Awaiting Parts` - Waiting for equipment/parts
4. **Tech marks as resolved** → Status: `Pending Confirmation`
5. **User confirms resolution** → Status: `Resolved` (moves to archive)

## Requisition Workflow

1. **User submits requisition** → Status: `Pending`
2. **Admin reviews request** → Status: `Approved` or `Declined`
3. **Admin fulfills request** → Status: `Fulfilled` (moves to archive)

## Database Schema

### Tables

**users**
- id (PRIMARY KEY)
- username (UNIQUE)
- password (plain text - should be hashed in production)
- role (admin, tech, or user)
- departmentId (FOREIGN KEY)

**departments**
- id (PRIMARY KEY)
- name (UNIQUE)

**tickets**
- id (PRIMARY KEY)
- title
- description
- category
- priority
- status
- dateCreated
- lastUpdated
- assignedTo
- userId (FOREIGN KEY)

**requisitions**
- id (PRIMARY KEY)
- itemRequested
- quantity
- reason
- urgencyLevel
- status
- dateCreated
- userId (FOREIGN KEY)

## Security Considerations

⚠️ **This is a demonstration application**. Before deploying to production:

1. **Hash passwords**: Use bcrypt or similar to hash passwords
2. **Use environment variables**: Store secrets in environment variables
3. **Enable HTTPS**: Set `secure: true` for cookies
4. **Use a proper session store**: Replace memory store with Redis or similar
5. **Input validation**: Add comprehensive input validation
6. **Rate limiting**: Implement rate limiting for API endpoints
7. **CSRF protection**: Add CSRF token validation
8. **SQL injection prevention**: Use parameterized queries (already implemented)

## Customization

### Adding New Ticket Categories
Edit the category dropdown in `public/index.html`:
```html
<select class="form-select" id="category" required>
    <option value="Software Issue">Software Issue</option>
    <option value="Hardware Issue">Hardware Issue</option>
    <option value="Network">Network</option>
    <option value="Custom Category">Custom Category</option>
</select>
```

### Adding New Ticket Statuses
Update the `ticketStatuses` object in `src/database.js`:
```javascript
const ticketStatuses = {
    active: ['Open', 'In Progress', 'Custom Status'],
    closed: ['Resolved', 'Closed']
};
```

### Modifying Priority Levels
Edit the priority dropdown in `public/index.html`:
```html
<select class="form-select" id="priority" required>
    <option value="Low">Low</option>
    <option value="Medium">Medium</option>
    <option value="High">High</option>
    <option value="Critical">Critical</option>
</select>
```

## Building for Production

To create a standalone executable:

```bash
npm run build
```

This creates executables in the `dist/` directory for your platform.

## Troubleshooting

### Database not initializing
- Ensure the application has write permissions in the project directory
- Delete `database.db` and restart to recreate the database

### Session issues
- Clear browser cookies and cache
- Ensure cookies are enabled in your browser

### Port already in use
- Change the port in `src/index.js` or set the `PORT` environment variable:
  ```bash
  PORT=3001 npm start
  ```

## Contributing

This is an internal help desk system. For feature requests or bug reports, contact the IT department.

## License

ISC

## Author

Jules

## Version History

### v1.0.0 (Current)
- Initial release
- Complete ticketing system
- Requisition management
- User and department management
- Report generation (CSV/PDF)
- Role-based access control
- Real-time notifications
