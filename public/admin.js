// Check user session before doing anything else
(async () => {
    try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
            window.location.href = '/login.html'; // Not authenticated
            return;
        }
        const user = await response.json();
        // If a regular user lands on the admin page, redirect them to the user view
        if (user.role === 'user') {
            window.location.href = '/index.html';
        }
    } catch (error) {
        window.location.href = '/login.html'; // Error checking session, redirect to login
    }
})();


document.addEventListener('DOMContentLoaded', () => {
    // State
    let allTickets = [];
    let allRequisitions = [];
    let allUsers = [];
    let currentUser = {};

    // --- Element Selectors ---
    const statsOpenTickets = document.getElementById('stats-open-tickets');
    const statsCriticalTickets = document.getElementById('stats-critical-tickets');
    const statsHighTickets = document.getElementById('stats-high-tickets');
    const statsPendingReqs = document.getElementById('stats-pending-reqs');
    const adminTicketList = document.getElementById('admin-ticket-list');
    const adminRequisitionList = document.getElementById('admin-requisition-list');
    const ticketSearch = document.getElementById('ticket-search');
    const ticketFilterStatus = document.getElementById('ticket-filter-status');
    const userList = document.getElementById('user-list');
    const createUserForm = document.getElementById('create-user-form');
    const userErrorMessage = document.getElementById('user-error-message');

    const priorityColors = {
        'Low': 'success',
        'Medium': 'warning',
        'High': 'danger',
        'Critical': 'danger fw-bold'
    };

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            const [sessionRes, ticketsRes, reqsRes, usersRes] = await Promise.all([
                fetch('/api/auth/session'),
                fetch('/api/tickets'),
                fetch('/api/requisitions'),
                fetch('/api/users') // Admins will fetch this
            ]);
            currentUser = await sessionRes.json();
            allTickets = await ticketsRes.json();
            allRequisitions = await reqsRes.json();
            if (usersRes.ok) {
                allUsers = await usersRes.json();
            }
            renderAll();
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    // --- Rendering ---
    const renderAll = () => {
        renderStats();
        renderTickets();
        renderRequisitions();
        if (currentUser.role === 'admin') {
            renderUsers();
        }
    };

    const buildStatusDropdown = (ticket) => {
        const standardStatuses = ['Open', 'In Progress', 'Resolved'];
        const techStatuses = ['Open', 'In Progress', 'Awaiting User Response', 'Awaiting Parts', 'Resolved'];

        const statuses = (currentUser.role === 'tech') ? techStatuses : standardStatuses;

        const options = statuses.map(status =>
            `<option value="${status}" ${ticket.status === status ? 'selected' : ''}>${status}</option>`
        ).join('');

        return `
            <select class="form-select form-select-sm mb-2" data-id="${ticket.id}" onchange="updateTicketStatus(this)">
                ${options}
            </select>
        `;
    };

    const renderStats = () => {
        statsOpenTickets.textContent = allTickets.filter(t => t.status !== 'Resolved').length;
        statsCriticalTickets.textContent = allTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;
        statsHighTickets.textContent = allTickets.filter(t => t.priority === 'High' && t.status !== 'Resolved').length;
        statsPendingReqs.textContent = allRequisitions.filter(r => r.status === 'Pending').length;
    };

    const renderTickets = () => {
        const searchTerm = ticketSearch.value.toLowerCase();
        const statusFilter = ticketFilterStatus.value;

        const filteredTickets = allTickets.filter(ticket => {
            const matchesSearch = ticket.title.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusFilter || ticket.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        adminTicketList.innerHTML = '';
        filteredTickets.forEach(ticket => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            item.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h5>${ticket.title}</h5>
                        <p>${ticket.description}</p>
                        <small>Category: ${ticket.category} | Submitted: ${new Date(ticket.dateCreated).toLocaleDateString()}</small>
                    </div>
                    <div class="col-md-2">
                        <span class="badge bg-${priorityColors[ticket.priority]}">${ticket.priority}</span>
                    </div>
                    <div class="col-md-4">
                        ${buildStatusDropdown(ticket)}
                        <input type="text" class="form-control form-control-sm" value="${ticket.assignedTo || ''}" placeholder="Assign to..." onchange="updateTicketAssignment(this, ${ticket.id})">
                    </div>
                </div>
            `;
            adminTicketList.appendChild(item);
        });
    };

    const renderRequisitions = () => {
        adminRequisitionList.innerHTML = '';
        allRequisitions.forEach(req => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            item.innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h5>${req.quantity} x ${req.itemRequested}</h5>
                        <p>Reason: ${req.reason}</p>
                        <small>Urgency: ${req.urgencyLevel}</small>
                    </div>
                    <div class="col-md-4">
                        <select class="form-select form-select-sm" data-id="${req.id}" onchange="updateRequisitionStatus(this)">
                            <option value="Pending" ${req.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Approved" ${req.status === 'Approved' ? 'selected' : ''}>Approved</option>
                            <option value="Declined" ${req.status === 'Declined' ? 'selected' : ''}>Declined</option>
                            <option value="Fulfilled" ${req.status === 'Fulfilled' ? 'selected' : ''}>Fulfilled</option>
                        </select>
                    </div>
                </div>
            `;
            adminRequisitionList.appendChild(item);
        });
    };

    // --- Update Logic ---
    window.updateTicketStatus = async (selectElement) => {
        const ticketId = selectElement.dataset.id;
        const status = selectElement.value;
        await updateTicket(ticketId, { status });
    };

    window.updateTicketAssignment = async (inputElement, ticketId) => {
        const assignedTo = inputElement.value;
        await updateTicket(ticketId, { assignedTo });
    };

    const updateTicket = async (id, data) => {
        try {
            const response = await fetch(`/api/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update ticket');
            // Optimistically update local data and re-render
            const ticket = allTickets.find(t => t.id == id);
            Object.assign(ticket, data);
            renderAll();
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    window.updateRequisitionStatus = async (selectElement) => {
        const id = selectElement.dataset.id;
        const status = selectElement.value;
        try {
            const response = await fetch(`/api/requisitions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!response.ok) throw new Error('Failed to update requisition');
            const requisition = allRequisitions.find(r => r.id == id);
            requisition.status = status;
            renderAll();
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    const renderUsers = () => {
        if (!userList) return;
        userList.innerHTML = '';
        allUsers.forEach(user => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <span>${user.username}</span>
                <span class="badge bg-primary rounded-pill">${user.role}</span>
            `;
            userList.appendChild(item);
        });
    };

    // --- Event Listeners ---
    ticketSearch.addEventListener('input', renderTickets);
    ticketFilterStatus.addEventListener('change', renderTickets);

    if (createUserForm) {
        createUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            userErrorMessage.textContent = '';

            const newUser = {
                username: document.getElementById('new-username').value,
                password: document.getElementById('new-password').value,
                role: document.getElementById('new-role').value,
            };

            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to create user');
                }

                const createdUser = await response.json();
                allUsers.push(createdUser);
                renderUsers();
                createUserForm.reset();

            } catch (error) {
                userErrorMessage.textContent = error.message;
                console.error('Failed to create user:', error);
            }
        });
    }

    // --- Initial Load ---
    fetchData();
});
