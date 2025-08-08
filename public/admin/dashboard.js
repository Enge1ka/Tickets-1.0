document.addEventListener('DOMContentLoaded', () => {
    // State
    let allTickets = [];
    let allRequisitions = [];
    let currentUser = {};
    let lastTicketCount = 0;
    let isFirstLoad = true;

    // --- Notification Setup ---
    const requestNotificationPermission = () => {
        if ('Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('Notification permission granted.');
                    }
                });
            }
        }
    };

    // --- Element Selectors ---
    const ticketList = document.getElementById('ticket-list');
    const requisitionList = document.getElementById('requisition-list');
    const ticketSearch = document.getElementById('ticket-search');

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            const [sessionRes, ticketsRes, reqsRes] = await Promise.all([
                fetch('/api/auth/session'),
                fetch('/api/tickets'),
                fetch('/api/requisitions')
            ]);
            currentUser = await sessionRes.json();
            allTickets = await ticketsRes.json();
            allRequisitions = await reqsRes.json();
            renderAll();
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    // --- Rendering ---
    const renderAll = () => {
        renderTickets();
        renderRequisitions();
    };

    const renderTickets = () => {
        const searchTerm = ticketSearch.value.toLowerCase();
        const filteredTickets = allTickets.filter(ticket => ticket.title.toLowerCase().includes(searchTerm));

        ticketList.innerHTML = '';
        filteredTickets.forEach(ticket => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            // Note: The user's name and department are now included from the enriched API
            item.innerHTML = `
                <h5>${ticket.title}</h5>
                <p>${ticket.description}</p>
                <small>Submitted by: ${ticket.userName} (${ticket.departmentName})</small>
                <hr>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="badge bg-secondary">${ticket.category}</span>
                        <span class="badge bg-primary">${ticket.priority}</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <select class="form-select form-select-sm w-auto me-2" id="status-select-${ticket.id}">
                            ${buildStatusOptions(ticket.status)}
                        </select>
                        <button class="btn btn-sm btn-success" onclick="updateTicketStatus(${ticket.id})">Update</button>
                    </div>
                </div>
            `;
            ticketList.appendChild(item);
        });
    };

    const renderRequisitions = () => {
        requisitionList.innerHTML = '';
        allRequisitions.forEach(req => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            // In a real app, requisitions would also be enriched with user/dept info
            item.innerHTML = `
                <h5>${req.quantity} x ${req.itemRequested}</h5>
                <small>Status: <span class="badge bg-info">${req.status}</span></small>
            `;
            requisitionList.appendChild(item);
        });
    };

    const buildStatusOptions = (currentStatus) => {
        const standardStatuses = ['Open', 'In Progress', 'Resolved'];
        const techStatuses = ['Open', 'In Progress', 'Awaiting User Response', 'Awaiting Parts', 'Resolved'];
        const statuses = (currentUser.role === 'tech') ? techStatuses : standardStatuses;
        return statuses.map(s => `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s}</option>`).join('');
    };

    // --- Update Logic ---
    window.updateTicketStatus = async (ticketId) => {
        const statusSelect = document.getElementById(`status-select-${ticketId}`);
        const newStatus = statusSelect.value;

        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update ticket');

            // Refresh data to show change
            const ticket = allTickets.find(t => t.id === ticketId);
            ticket.status = newStatus;
            // No need to re-render everything, but it's simple enough for this app
            renderTickets();

        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update status.');
        }
    };

    // --- Sound ---
    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 pitch
            oscillator.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5); // Beep for 500ms
        } catch (e) {
            console.error('Could not play sound:', e);
        }
    };

    // --- Polling for Notifications ---
    const pollForNewTickets = async () => {
        try {
            const response = await fetch('/api/tickets');
            if (!response.ok) return; // Fail silently
            const currentTickets = await response.json();

            if (isFirstLoad) {
                lastTicketCount = currentTickets.length;
                isFirstLoad = false;
                return;
            }

            if (currentTickets.length > lastTicketCount) {
                if (Notification.permission === 'granted') {
                    new Notification('New Ticket Submitted!', {
                        body: `A new ticket titled "${currentTickets[currentTickets.length - 1].title}" has been created.`
                    });
                    playNotificationSound();
                }
                // Also refresh the ticket list on the page
                allTickets = currentTickets;
                renderTickets();
            }
            lastTicketCount = currentTickets.length;

        } catch (error) {
            console.error('Polling error:', error);
        }
    };

    // --- Event Listeners ---
    ticketSearch.addEventListener('input', renderTickets);

    // --- Initial Load ---
    fetchData();
    requestNotificationPermission();
    setInterval(pollForNewTickets, 10000); // Poll every 10 seconds
});
