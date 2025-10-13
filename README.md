# Help Desk Ticketing System

A comprehensive web-based help desk ticketing system built with Node.js, Express, SQLite, and Bootstrap. This system provides a complete solution for IT support teams to manage tickets, track SLAs, maintain a knowledge base, and handle requisitions.

## Features

### 🎫 Ticket Management
- **Create, view, and manage support tickets**
- **Priority-based ticket handling** (Critical, High, Medium, Low)
- **Status tracking** (Open, In Progress, Pending Confirmation, Resolved, Closed, etc.)
- **SLA tracking** with automatic violation detection
- **Ticket assignment** to support technicians
- **Ticket comments** for communication between users and support staff
- **Tags system** for better organization and searchability
- **Ticket history** tracking all changes and actions

### 📚 Knowledge Base
- **Self-service knowledge base** with searchable articles
- **Category-based organization** of articles
- **Tag-based filtering** for easy discovery
- **View count tracking** to identify popular articles
- **Admin management** of knowledge base content
- **Public/private article visibility** controls

### 📋 Requisition Management
- **IT equipment and software requisition** system
- **Approval workflow** for requisition requests
- **Status tracking** (Pending, Approved, Declined, Fulfilled)
- **Integration with ticketing system**

### 👥 User Management
- **Role-based access control** (Admin, Tech, User)
- **Department-based organization**
- **Session-based authentication**
- **User-specific ticket views**

### 📊 SLA & Performance Tracking
- **Automatic SLA calculation** based on priority levels
- **SLA violation alerts** and tracking
- **Response time monitoring**
- **Escalation system** for overdue tickets

### 🎨 Modern UI/UX
- **Responsive Bootstrap 5 design**
- **Modal-based ticket details** and comments
- **Real-time notifications** for new tickets
- **Intuitive admin dashboard**
- **Search and filter capabilities**

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd help-desk-ticketing-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Access the application:**
   - Open your browser and navigate to `http://localhost:3000`
   - Default login credentials:
     - Admin: `admin` / `password`
     - Tech: `tech` / `password`
     - User: `user` / `password`

## Project Structure

```
├── src/
│   ├── api/
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── tickets.js           # Ticket management API
│   │   ├── knowledge-base.js    # Knowledge base API
│   │   ├── users.js             # User management API
│   │   ├── departments.js       # Department management API
│   │   ├── requisitions.js      # Requisition management API
│   │   └── reports.js           # Reporting API
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── database.js              # Database configuration and setup
│   └── index.js                 # Main server file
├── public/
│   ├── admin/                   # Admin dashboard files
│   │   ├── dashboard.html       # Admin dashboard
│   │   ├── dashboard.js         # Admin dashboard logic
│   │   └── main.js              # Admin navigation
│   ├── index.html               # User interface
│   ├── login.html               # Login page
│   ├── app.js                   # Main application logic
│   ├── login.js                 # Login functionality
│   └── style.css                # Custom styles
├── package.json
└── README.md
```

## Database Schema

The system uses SQLite with the following main tables:

- **users** - User accounts with roles and departments
- **departments** - Organizational departments
- **tickets** - Support tickets with SLA tracking
- **ticket_comments** - Comments on tickets
- **ticket_attachments** - File attachments (structure ready)
- **ticket_history** - Audit trail of ticket changes
- **knowledge_base** - Self-service articles
- **sla_policies** - SLA rules by priority
- **requisitions** - Equipment/software requests

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### Tickets
- `GET /api/tickets` - Get active tickets
- `GET /api/tickets/archived` - Get resolved tickets
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `GET /api/tickets/:id/comments` - Get ticket comments
- `POST /api/tickets/:id/comments` - Add ticket comment

### Knowledge Base
- `GET /api/knowledge-base` - Get all articles
- `GET /api/knowledge-base/categories` - Get categories
- `GET /api/knowledge-base/:id` - Get specific article
- `POST /api/knowledge-base` - Create article (admin/tech)
- `PUT /api/knowledge-base/:id` - Update article (admin/tech)
- `DELETE /api/knowledge-base/:id` - Delete article (admin)

### Users & Departments
- `GET /api/users` - Get all users
- `GET /api/departments` - Get all departments

### Requisitions
- `GET /api/requisitions` - Get requisitions
- `POST /api/requisitions` - Create requisition
- `PUT /api/requisitions/:id` - Update requisition status

## SLA Configuration

The system includes predefined SLA policies:

| Priority | Response Time | Resolution Time |
|----------|---------------|-----------------|
| Critical | 1 hour        | 4 hours         |
| High     | 4 hours       | 24 hours        |
| Medium   | 8 hours       | 72 hours        |
| Low      | 24 hours      | 168 hours       |

## User Roles

### Admin
- Full system access
- Manage all tickets and assignments
- Create/edit/delete knowledge base articles
- Manage users and departments
- View all reports and analytics

### Tech (Technician)
- View and manage assigned tickets
- Update ticket status and assignments
- Create/edit knowledge base articles
- Add internal comments to tickets

### User (End User)
- Create support tickets
- View own tickets and history
- Add comments to own tickets
- Access knowledge base
- Submit requisitions

## Features in Development

The following features are planned or partially implemented:

- **File Attachments** - Support for uploading files to tickets
- **Email Notifications** - Automated email alerts for ticket updates
- **Automatic Escalation** - Auto-escalate tickets based on SLA violations
- **Advanced Reporting** - Detailed analytics and performance metrics
- **Auto-Assignment** - Intelligent ticket assignment based on workload

## Security Considerations

⚠️ **Important**: This is a development/demo system. For production use:

1. **Hash passwords** - Currently using plaintext passwords
2. **Use HTTPS** - Enable SSL/TLS encryption
3. **Environment variables** - Move secrets to environment variables
4. **Input validation** - Add comprehensive input sanitization
5. **Rate limiting** - Implement API rate limiting
6. **Session security** - Use secure session stores

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support or questions about this help desk system:

1. Check the knowledge base for common issues
2. Create a support ticket through the system
3. Contact the development team

---

**Built with ❤️ for efficient IT support management**