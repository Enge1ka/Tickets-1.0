// Check user session before doing anything else
(async () => {
    try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
            window.location.href = '/login.html'; // Not authenticated
            return;
        }
        const user = await response.json();
        // If an admin or tech lands on the user page, redirect them to the admin dashboard
        if (user.role === 'admin' || user.role === 'tech') {
            window.location.href = '/admin.html';
        }
    } catch (error) {
        window.location.href = '/login.html'; // Error checking session, redirect to login
    }
})();


document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });

    const ticketForm = document.getElementById('ticket-form');
    const ticketList = document.getElementById('ticket-list');

    const priorityColors = {
        'Low': 'success',
        'Medium': 'warning',
        'High': 'danger',
        'Critical': 'danger fw-bold'
    };

    // Fetch and display existing tickets
    const fetchTickets = async () => {
        try {
            const response = await fetch('/api/tickets');
            if (!response.ok) {
                throw new Error('Failed to fetch tickets');
            }
            const tickets = await response.json();
            renderTickets(tickets);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            ticketList.innerHTML = '<div class="alert alert-danger">Could not load tickets.</div>';
        }
    };

    // Render tickets to the list
    const renderTickets = (tickets) => {
        ticketList.innerHTML = '';
        if (tickets.length === 0) {
            ticketList.innerHTML = '<p>No tickets found.</p>';
            return;
        }

        tickets.forEach(ticket => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = `list-group-item list-group-item-action`;
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${ticket.title}</h5>
                    <small>Last Updated: ${new Date(ticket.lastUpdated).toLocaleString()}</small>
                </div>
                <p class="mb-1">${ticket.description}</p>
                <small>
                    <span class="badge bg-secondary">${ticket.category}</span>
                    <span class="badge bg-${priorityColors[ticket.priority] || 'secondary'}">${ticket.priority}</span>
                    <span class="badge bg-info text-dark">${ticket.status}</span>
                </small>
            `;
            ticketList.appendChild(item);
        });
    };

    // Handle form submission
    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newTicket = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            priority: document.getElementById('priority').value
        };

        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTicket)
            });

            if (!response.ok) {
                throw new Error('Failed to create ticket');
            }

            // Clear form and refresh ticket list
            ticketForm.reset();
            fetchTickets();

        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('There was an error submitting your ticket. Please try again.');
        }
    });

    // Initial fetch
    fetchTickets();

    // --- Requisition Logic ---
    const requisitionForm = document.getElementById('requisition-form');
    const requisitionList = document.getElementById('requisition-list');

    // Fetch and display existing requisitions
    const fetchRequisitions = async () => {
        try {
            const response = await fetch('/api/requisitions');
            if (!response.ok) throw new Error('Failed to fetch requisitions');
            const requisitions = await response.json();
            renderRequisitions(requisitions);
        } catch (error) {
            console.error('Error fetching requisitions:', error);
            requisitionList.innerHTML = '<div class="alert alert-danger">Could not load requisitions.</div>';
        }
    };

    // Render requisitions to the list
    const renderRequisitions = (requisitions) => {
        requisitionList.innerHTML = '';
        if (requisitions.length === 0) {
            requisitionList.innerHTML = '<p>No requisitions found.</p>';
            return;
        }

        requisitions.forEach(req => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${req.quantity} x ${req.itemRequested}</h5>
                    <small>Status: <span class="badge bg-info">${req.status}</span></small>
                </div>
                <p class="mb-1">Reason: ${req.reason}</p>
                <small>Urgency: ${req.urgencyLevel}</small>
            `;
            requisitionList.appendChild(item);
        });
    };

    // Handle requisition form submission
    requisitionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newRequisition = {
            itemRequested: document.getElementById('item').value,
            quantity: document.getElementById('quantity').value,
            reason: document.getElementById('reason').value,
            urgencyLevel: document.getElementById('urgency').value,
        };

        try {
            const response = await fetch('/api/requisitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRequisition)
            });

            if (!response.ok) throw new Error('Failed to create requisition');

            requisitionForm.reset();
            fetchRequisitions();

        } catch (error) {
            console.error('Error creating requisition:', error);
            alert('There was an error submitting your requisition.');
        }
    });

    // Initial fetch for requisitions
    fetchRequisitions();
});
