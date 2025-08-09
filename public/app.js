// Check user session before doing anything else
(async () => {
    try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
            window.location.href = '/login.html'; // Not authenticated
            return;
        }
        const user = await response.json();
        if (user.role === 'admin' || user.role === 'tech') {
            window.location.href = '/admin/dashboard.html';
        }
    } catch (error) {
        window.location.href = '/login.html';
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // --- Selectors ---
    const logoutBtn = document.getElementById('logout-btn');
    const ticketForm = document.getElementById('ticket-form');
    const ticketList = document.getElementById('ticket-list');
    const resolvedTicketList = document.getElementById('resolved-ticket-list');
    const requisitionForm = document.getElementById('requisition-form');
    const requisitionList = document.getElementById('requisition-list');

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            const [activeTickets, archivedTickets, requisitions] = await Promise.all([
                fetch('/api/tickets').then(res => res.json()),
                fetch('/api/tickets/archived').then(res => res.json()),
                fetch('/api/requisitions').then(res => res.json())
            ]);
            renderActiveTickets(activeTickets);
            renderResolvedTickets(archivedTickets);
            renderRequisitions(requisitions);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    // --- Rendering ---
    const renderActiveTickets = (tickets) => {
        ticketList.innerHTML = '';
        if (tickets.length === 0) {
            ticketList.innerHTML = '<p>You have no active tickets.</p>';
            return;
        }
        tickets.forEach(ticket => {
            const item = document.createElement('div');
            item.className = 'list-group-item';

            let confirmationButton = '';
            if (ticket.status === 'Pending Confirmation') {
                confirmationButton = `<button class="btn btn-sm btn-primary mt-2" onclick="confirmResolution(${ticket.id})">Confirm Resolution</button>`;
            }

            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${ticket.title}</h5>
                    <span class="badge bg-info text-dark">${ticket.status}</span>
                </div>
                <p class="mb-1">${ticket.description}</p>
                ${confirmationButton}
            `;
            ticketList.appendChild(item);
        });
    };

    const renderResolvedTickets = (tickets) => {
        resolvedTicketList.innerHTML = '';
        if (tickets.length === 0) {
            resolvedTicketList.innerHTML = '<p>You have no resolved tickets.</p>';
            return;
        }
        resolvedTicketList.innerHTML = tickets.map(ticket => `
            <div class="list-group-item text-muted">
                <h5 class="mb-1">${ticket.title}</h5>
                <small>Resolved on: ${new Date(ticket.lastUpdated).toLocaleDateString()}</small>
            </div>
        `).join('');
    };

    const renderRequisitions = (requisitions) => {
        requisitionList.innerHTML = '';
        if (requisitions.length === 0) {
            requisitionList.innerHTML = '<p>You have no active requisitions.</p>';
            return;
        }
        requisitionList.innerHTML = requisitions.map(req => `
            <div class="list-group-item">
                <h5 class="mb-1">${req.quantity} x ${req.itemRequested}</h5>
                <small>Status: ${req.status}</small>
            </div>
        `).join('');
    };

    // --- Event Handlers & Actions ---
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTicket)
            });
            if (!response.ok) throw new Error('Failed to create ticket');
            ticketForm.reset();
            fetchData(); // Re-fetch all data
        } catch (error) {
            console.error(error);
            alert('Error creating ticket.');
        }
    });

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
            fetchData(); // Re-fetch all data
        } catch (error) {
            console.error(error);
            alert('Error creating requisition.');
        }
    });

    window.confirmResolution = async (ticketId) => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Resolved' })
            });
            if (!response.ok) throw new Error('Failed to confirm resolution');
            fetchData(); // Re-fetch all data to move ticket to history
        } catch (error) {
            console.error(error);
            alert('Error confirming resolution.');
        }
    };

    // --- Initial Load ---
    fetchData();
});
