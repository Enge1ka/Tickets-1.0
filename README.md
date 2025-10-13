# Help Desk Ticketing System

A comprehensive web-based ticketing and requisition system built with Node.js, Express.js, and SQLite. This system allows users to submit IT support tickets and equipment requisitions, while administrators and technicians can manage and track them efficiently.

## Features

### User Features
- **Ticket Submission**: Create support tickets with categories, priorities, and detailed descriptions
- **Ticket Tracking**: View active tickets and their status updates
- **Ticket History**: Access resolved/closed tickets
- **Requisition Requests**: Submit equipment and supply requests
- **Real-time Updates**: Automatic page refresh when tickets are updated

### Admin/Technician Features
- **Dashboard**: Overview of all tickets and requisitions
- **Ticket Management**: Update ticket status, assign tickets, view detailed information
- **User Management**: Create, edit, and manage user accounts
- **Department Management**: Add and manage departments
- **Reports**: Generate CSV and PDF reports of tickets
- **Archive**: View resolved tickets and completed requisitions
- **Real-time Notifications**: Browser notifications for new tickets
- **Search**: Search and filter tickets by title

### System Features
- **Role-based Access Control**: Three user roles (admin, tech, user)
- **Session Management**: Secure login/logout with session persistence
- **Database**: SQLite database with proper relationships
- **Responsive Design**: Bootstrap-based UI that works on all devices
- **Real-time Updates**: Automatic polling for new tickets

## User Roles

### Admin
- Full access to all features
- User management
- Department management
- All ticket and requisition management
- Report generation

### Technician (Tech)
- Ticket management and status updates
- View all tickets and requisitions
- Cannot manage users or departments
- Report generation

### User
- Submit tickets and requisitions
- View own tickets and requisitions
- Confirm ticket resolutions

## Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd ticketing-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Open your browser and go to `http://localhost:3001`
   - The system will automatically create the database and seed initial data

## Default Login Credentials

The system comes with pre-configured users:

| Username | Password | Role | Department |
|----------|----------|------|------------|
| admin    | password | admin | IT Support |
| tech     | password | tech | IT Support |
| user     | password | user | Human Resources |

**⚠️ Security Note**: Change these default passwords in a production environment!

## Database Schema

### Tables

#### Users
- `id` (Primary Key)
- `username` (Unique)
- `password` (Plain text - should be hashed in production)
- `role` (admin, tech, user)
- `departmentId` (Foreign Key to departments)

#### Departments
- `id` (Primary Key)
- `name` (Unique)

#### Tickets
- `id` (Primary Key)
- `title`
- `description`
- `category` (Software Issue, Hardware Issue, Network, Other)
- `priority` (Low, Medium, High, Critical)
- `status` (Open, In Progress, Awaiting User Response, Awaiting Parts, Pending Confirmation, Resolved, Cancelled, Closed)
- `dateCreated`
- `lastUpdated`
- `assignedTo`
- `userId` (Foreign Key to users)

#### Requisitions
- `id` (Primary Key)
- `itemRequested`
- `quantity`
- `reason`
- `urgencyLevel` (Low, Medium, High)
- `status` (Pending, Approved, Declined, Fulfilled)
- `dateCreated`
- `userId` (Foreign Key to users)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### Tickets
- `GET /api/tickets` - Get active tickets
- `GET /api/tickets/archived` - Get archived tickets
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket status

### Requisitions
- `GET /api/requisitions` - Get active requisitions
- `GET /api/requisitions/archived` - Get archived requisitions
- `POST /api/requisitions` - Create new requisition
- `PUT /api/requisitions/:id` - Update requisition status

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user

### Departments (Admin only)
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department

### Reports (Admin/Tech only)
- `GET /api/reports/tickets/csv` - Download tickets as CSV
- `GET /api/reports/tickets/pdf` - Download tickets as PDF

## File Structure

```
ticketing-system/
├── src/
│   ├── api/                 # API route handlers
│   │   ├── auth.js         # Authentication routes
│   │   ├── tickets.js      # Ticket management routes
│   │   ├── requisitions.js # Requisition routes
│   │   ├── users.js        # User management routes
│   │   ├── departments.js  # Department routes
│   │   └── reports.js      # Report generation routes
│   ├── middleware/
│   │   └── auth.js         # Authentication middleware
│   ├── database.js         # Database configuration and initialization
│   └── index.js           # Main server file
├── public/                 # Frontend files
│   ├── admin/             # Admin panel pages
│   │   ├── dashboard.html
│   │   ├── users.html
│   │   ├── settings.html
│   │   ├── reports.html
│   │   ├── archive.html
│   │   └── *.js           # Corresponding JavaScript files
│   ├── index.html         # User dashboard
│   ├── login.html         # Login page
│   ├── app.js            # User dashboard JavaScript
│   ├── login.js          # Login page JavaScript
│   └── style.css         # Custom styles
├── package.json
└── README.md
```

## Ticket Workflow

1. **User submits ticket** with title, description, category, and priority
2. **Ticket appears in admin/tech dashboard** with "Open" status
3. **Technician/Admin updates status** to "In Progress" when working on it
4. **Status updates** can include:
   - In Progress
   - Awaiting User Response
   - Awaiting Parts
   - Pending Confirmation
5. **When resolved**, status changes to "Pending Confirmation"
6. **User confirms resolution** or ticket moves to "Resolved"
7. **Resolved tickets** appear in archive

## Requisition Workflow

1. **User submits requisition** with item details and reason
2. **Admin reviews** and updates status to "Approved" or "Declined"
3. **When fulfilled**, status changes to "Fulfilled"
4. **Completed requisitions** appear in archive

## Security Considerations

⚠️ **Important**: This is a development/demo system. For production use:

1. **Hash passwords** using bcrypt or similar
2. **Use HTTPS** for all communications
3. **Implement proper session security** with secure cookies
4. **Add input validation** and sanitization
5. **Implement rate limiting** for API endpoints
6. **Use environment variables** for sensitive configuration
7. **Add proper error handling** and logging
8. **Implement CSRF protection**

## Development

### Running in Development Mode
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Building for Production
```bash
npm run build  # Creates executable with pkg
```

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## License

ISC License

## Support

For issues or questions, please check the code comments or create an issue in the repository.

---

**Note**: This system is designed for internal use and includes basic security measures. For production deployment, additional security hardening and testing is recommended.