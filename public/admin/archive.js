document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const resolvedTicketList = document.getElementById('resolved-ticket-list');
    const completedRequisitionList = document.getElementById('completed-requisition-list');

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            const [ticketsRes, reqsRes] = await Promise.all([
                fetch('/api/tickets/archived'),
                fetch('/api/requisitions/archived')
            ]);

            if (ticketsRes.ok) {
                const tickets = await ticketsRes.json();
                renderArchivedTickets(tickets);
            }

            if (reqsRes.ok) {
                const requisitions = await reqsRes.json();
                renderCompletedRequisitions(requisitions);
            }

        } catch (error) {
            console.error('Failed to fetch archived data:', error);
        }
    };

    // --- Rendering ---
    const renderArchivedTickets = (tickets) => {
        if (tickets.length === 0) {
            resolvedTicketList.innerHTML = '<p>No resolved tickets found.</p>';
            return;
        }
        resolvedTicketList.innerHTML = tickets.map(ticket => `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1 text-muted">${ticket.title}</h5>
                    <small>Resolved on: ${new Date(ticket.lastUpdated).toLocaleDateString()}</small>
                </div>
                <p class="mb-1">${ticket.description}</p>
            </div>
        `).join('');
    };

    const renderCompletedRequisitions = (requisitions) => {
        if (requisitions.length === 0) {
            completedRequisitionList.innerHTML = '<p>No completed requisitions found.</p>';
            return;
        }
        completedRequisitionList.innerHTML = requisitions.map(req => `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1 text-muted">${req.quantity} x ${req.itemRequested}</h5>
                    <small>Status: ${req.status}</small>
                </div>
            </div>
        `).join('');
    };

    // --- Initial Load ---
    fetchData();
});
