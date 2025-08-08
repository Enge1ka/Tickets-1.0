document.addEventListener('DOMContentLoaded', () => {
    // State
    let allTickets = [];
    let allRequisitions = [];

    // --- Element Selectors ---
    const statsOpenTickets = document.getElementById('stats-open-tickets');
    const statsCriticalTickets = document.getElementById('stats-critical-tickets');
    const statsHighTickets = document.getElementById('stats-high-tickets');
    const statsPendingReqs = document.getElementById('stats-pending-reqs');
    const adminTicketList = document.getElementById('admin-ticket-list');
    const adminRequisitionList = document.getElementById('admin-requisition-list');
    const ticketSearch = document.getElementById('ticket-search');
    const ticketFilterStatus = document.getElementById('ticket-filter-status');

    const priorityColors = {
        'Low': 'success',
        'Medium': 'warning',
        'High': 'danger',
        'Critical': 'danger fw-bold'
    };

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            const [ticketsRes, reqsRes] = await Promise.all([
                fetch('/api/tickets'),
                fetch('/api/requisitions')
            ]);
            allTickets = await ticketsRes.json();
            allRequisitions = await reqsRes.json();
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
                        <select class="form-select form-select-sm mb-2" data-id="${ticket.id}" onchange="updateTicketStatus(this)">
                            <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
                            <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
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

    // --- Event Listeners ---
    ticketSearch.addEventListener('input', renderTickets);
    ticketFilterStatus.addEventListener('change', renderTickets);

    // --- Initial Load ---
    fetchData();
});
