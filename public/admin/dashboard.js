document.addEventListener('DOMContentLoaded', () => {
    // State
    let allTickets = [];
    let allRequisitions = [];
    let allKBArticles = [];
    let currentUser = {};
    let lastTicketCount = 0;
    let isFirstLoad = true;
    let availableTechs = [];

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
    const kbAdminList = document.getElementById('kb-admin-list');

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            const [sessionRes, ticketsRes, reqsRes, usersRes, kbRes] = await Promise.all([
                fetch('/api/auth/session'),
                fetch('/api/tickets'),
                fetch('/api/requisitions'),
                fetch('/api/users'),
                fetch('/api/knowledge-base')
            ]);
            currentUser = await sessionRes.json();
            allTickets = await ticketsRes.json();
            allRequisitions = await reqsRes.json();
            availableTechs = (await usersRes.json()).filter(u => u.role === 'tech' || u.role === 'admin');
            allKBArticles = await kbRes.json();
            renderAll();
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    // --- Rendering ---
    const renderAll = () => {
        renderTickets();
        renderRequisitions();
        renderKBAdmin();
    };

    const renderTickets = () => {
        const searchTerm = ticketSearch.value.toLowerCase();
        const filteredTickets = allTickets.filter(ticket => ticket.title.toLowerCase().includes(searchTerm));

        ticketList.innerHTML = '';
        filteredTickets.forEach(ticket => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            
            const priorityColor = {
                'Critical': 'danger',
                'High': 'warning',
                'Medium': 'info',
                'Low': 'secondary'
            }[ticket.priority] || 'secondary';

            const assignmentOptions = availableTechs.map(tech => 
                `<option value="${tech.id}" ${tech.id === ticket.assignedTo ? 'selected' : ''}>${tech.username}</option>`
            ).join('');

            const tags = ticket.tags ? ticket.tags.split(',').map(tag => 
                `<span class="badge bg-light text-dark me-1">${tag.trim()}</span>`
            ).join('') : '';

            const dueDate = ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'N/A';

            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${ticket.title}</h5>
                    <div>
                        <span class="badge bg-${priorityColor} me-1">${ticket.priority}</span>
                        <span class="badge bg-info">${ticket.status}</span>
                        ${ticket.slaViolated ? '<span class="badge bg-danger ms-1">SLA Violated</span>' : ''}
                    </div>
                </div>
                <div class="d-flex align-items-center justify-content-between mt-2">
                     <button class="btn btn-sm btn-outline-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-ticket-${ticket.id}">
                        Show Details
                    </button>
                    <div class="d-flex align-items-center gap-2">
                        <select class="form-select form-select-sm" id="assign-select-${ticket.id}">
                            <option value="">Unassigned</option>
                            ${assignmentOptions}
                        </select>
                        <select class="form-select form-select-sm" id="status-select-${ticket.id}">
                            ${buildStatusOptions(ticket.status)}
                        </select>
                        <button class="btn btn-sm btn-success" onclick="updateTicket(${ticket.id})">Update</button>
                    </div>
                </div>
                <div class="collapse mt-3" id="collapse-ticket-${ticket.id}">
                    <div class="card card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Description:</strong> ${ticket.description}</p>
                                <p class="mb-1"><strong>Submitted by:</strong> ${ticket.userName} (${ticket.departmentName || 'N/A'})</p>
                                <p class="mb-1"><strong>Category:</strong> ${ticket.category}</p>
                                <p class="mb-1"><strong>Assigned To:</strong> ${ticket.assignedToName || 'Unassigned'}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Created:</strong> ${new Date(ticket.dateCreated).toLocaleString()}</p>
                                <p class="mb-1"><strong>Due Date:</strong> ${dueDate}</p>
                                <p class="mb-1"><strong>Last Updated:</strong> ${new Date(ticket.lastUpdated).toLocaleString()}</p>
                                <div class="mb-1"><strong>Tags:</strong> ${tags || 'None'}</div>
                            </div>
                        </div>
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
            const statuses = ['Pending', 'Approved', 'Declined', 'Fulfilled'];
            const statusOptions = statuses.map(s => `<option value="${s}" ${s === req.status ? 'selected' : ''}>${s}</option>`).join('');

            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5>${req.quantity} x ${req.itemRequested}</h5>
                        <p class="mb-0">Reason: ${req.reason}</p>
                    </div>
                    <div class="d-flex align-items-center">
                        <select class="form-select form-select-sm w-auto me-2" id="req-status-select-${req.id}">
                            ${statusOptions}
                        </select>
                        <button class="btn btn-sm btn-success" onclick="updateRequisitionStatus(${req.id})">Update</button>
                    </div>
                </div>
            `;
            requisitionList.appendChild(item);
        });
    };

    const renderKBAdmin = () => {
        kbAdminList.innerHTML = '';
        allKBArticles.forEach(article => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            
            const tags = article.tags ? article.tags.split(',').map(tag => 
                `<span class="badge bg-secondary me-1">${tag.trim()}</span>`
            ).join('') : '';

            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${article.title}</h6>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="editArticle(${article.id})">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteArticle(${article.id})">Delete</button>
                    </div>
                </div>
                <p class="mb-1">${article.content.substring(0, 100)}${article.content.length > 100 ? '...' : ''}</p>
                <div class="d-flex justify-content-between">
                    <small class="text-muted">
                        Category: ${article.category} | 
                        Views: ${article.viewCount} | 
                        ${article.isPublic ? 'Public' : 'Private'}
                    </small>
                    <div>${tags}</div>
                </div>
            `;
            kbAdminList.appendChild(item);
        });
    };

    const buildStatusOptions = (currentStatus) => {
        const standardStatuses = ['Open', 'In Progress', 'Pending Confirmation', 'Resolved'];
        const techStatuses = ['Open', 'In Progress', 'Awaiting User Response', 'Awaiting Parts', 'Pending Confirmation'];
        const statuses = (currentUser.role === 'tech') ? techStatuses : standardStatuses;
        return statuses.map(s => `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s}</option>`).join('');
    };

    // --- Update Logic ---
    window.updateRequisitionStatus = async (reqId) => {
        const statusSelect = document.getElementById(`req-status-select-${reqId}`);
        const newStatus = statusSelect.value;

        try {
            const response = await fetch(`/api/requisitions/${reqId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update requisition');

            const requisition = allRequisitions.find(r => r.id === reqId);
            requisition.status = newStatus;
            renderRequisitions();

        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update status.');
        }
    };

    window.updateTicket = async (ticketId) => {
        const statusSelect = document.getElementById(`status-select-${ticketId}`);
        const assignSelect = document.getElementById(`assign-select-${ticketId}`);
        const newStatus = statusSelect.value;
        const newAssignment = assignSelect.value || null;

        const updateData = {};
        if (newStatus) updateData.status = newStatus;
        if (newAssignment !== undefined) updateData.assignedTo = newAssignment;

        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) throw new Error('Failed to update ticket');

            // Refresh data to show change
            const updatedTicket = await response.json();
            const ticketIndex = allTickets.findIndex(t => t.id === ticketId);
            if (ticketIndex !== -1) {
                allTickets[ticketIndex] = updatedTicket;
            }
            renderTickets();

        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update ticket.');
        }
    };

    // Legacy function for backward compatibility
    window.updateTicketStatus = window.updateTicket;

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

    // Knowledge Base Management Functions
    window.showCreateArticleModal = () => {
        document.getElementById('articleModalLabel').textContent = 'Create Article';
        document.getElementById('article-form').reset();
        document.getElementById('article-id').value = '';
        new bootstrap.Modal(document.getElementById('articleModal')).show();
    };

    window.editArticle = async (articleId) => {
        try {
            const article = allKBArticles.find(a => a.id === articleId);
            if (!article) return;

            document.getElementById('articleModalLabel').textContent = 'Edit Article';
            document.getElementById('article-id').value = article.id;
            document.getElementById('article-title').value = article.title;
            document.getElementById('article-category').value = article.category;
            document.getElementById('article-tags').value = article.tags;
            document.getElementById('article-content').value = article.content;
            document.getElementById('article-public').checked = article.isPublic;

            new bootstrap.Modal(document.getElementById('articleModal')).show();
        } catch (error) {
            console.error('Error loading article for edit:', error);
            alert('Error loading article');
        }
    };

    window.saveArticle = async () => {
        const articleId = document.getElementById('article-id').value;
        const title = document.getElementById('article-title').value;
        const category = document.getElementById('article-category').value;
        const tags = document.getElementById('article-tags').value;
        const content = document.getElementById('article-content').value;
        const isPublic = document.getElementById('article-public').checked;

        if (!title || !category || !content) {
            alert('Please fill in all required fields');
            return;
        }

        const articleData = { title, category, tags, content, isPublic };

        try {
            const url = articleId ? `/api/knowledge-base/${articleId}` : '/api/knowledge-base';
            const method = articleId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(articleData)
            });

            if (!response.ok) throw new Error('Failed to save article');

            bootstrap.Modal.getInstance(document.getElementById('articleModal')).hide();
            
            // Refresh knowledge base data
            const kbRes = await fetch('/api/knowledge-base');
            allKBArticles = await kbRes.json();
            renderKBAdmin();

        } catch (error) {
            console.error('Error saving article:', error);
            alert('Error saving article');
        }
    };

    window.deleteArticle = async (articleId) => {
        if (!confirm('Are you sure you want to delete this article?')) return;

        try {
            const response = await fetch(`/api/knowledge-base/${articleId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete article');

            // Refresh knowledge base data
            const kbRes = await fetch('/api/knowledge-base');
            allKBArticles = await kbRes.json();
            renderKBAdmin();

        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Error deleting article');
        }
    };

    // --- Event Listeners ---
    ticketSearch.addEventListener('input', renderTickets);

    // --- Initial Load ---
    fetchData();
    requestNotificationPermission();
    setInterval(pollForNewTickets, 10000); // Poll every 10 seconds
});
