// Global variables
let currentUser = null;
let currentTicketId = null;
let knowledgeBaseArticles = [];
let kbCategories = [];

// Check user session before doing anything else
(async () => {
    try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
            window.location.href = '/login.html'; // Not authenticated
            return;
        }
        currentUser = await response.json();
        if (currentUser.role === 'admin' || currentUser.role === 'tech') {
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
    const kbSearch = document.getElementById('kb-search');
    const kbCategory = document.getElementById('kb-category');
    const knowledgeBaseList = document.getElementById('knowledge-base-list');
    const addCommentBtn = document.getElementById('add-comment-btn');

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

    const fetchKnowledgeBase = async () => {
        try {
            const [articles, categories] = await Promise.all([
                fetch('/api/knowledge-base').then(res => res.json()),
                fetch('/api/knowledge-base/categories').then(res => res.json())
            ]);
            knowledgeBaseArticles = articles;
            kbCategories = categories;
            renderKnowledgeBase();
            renderKBCategories();
        } catch (error) {
            console.error('Failed to fetch knowledge base:', error);
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

            const priorityColor = {
                'Critical': 'danger',
                'High': 'warning', 
                'Medium': 'info',
                'Low': 'secondary'
            }[ticket.priority] || 'secondary';

            const statusColor = ticket.slaViolated ? 'danger' : 'info';
            const dueDate = ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'N/A';
            const tags = ticket.tags ? ticket.tags.split(',').map(tag => 
                `<span class="badge bg-light text-dark me-1">${tag.trim()}</span>`
            ).join('') : '';

            let confirmationButton = '';
            if (ticket.status === 'Pending Confirmation') {
                confirmationButton = `<button class="btn btn-sm btn-primary mt-2" onclick="confirmResolution(${ticket.id})">Confirm Resolution</button>`;
            }

            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">
                        <a href="#" onclick="showTicketDetails(${ticket.id})" class="text-decoration-none">${ticket.title}</a>
                    </h5>
                    <div>
                        <span class="badge bg-${priorityColor} me-1">${ticket.priority}</span>
                        <span class="badge bg-${statusColor}">${ticket.status}</span>
                        ${ticket.slaViolated ? '<span class="badge bg-danger ms-1">SLA Violated</span>' : ''}
                    </div>
                </div>
                <p class="mb-1">${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}</p>
                <small class="text-muted">Due: ${dueDate} | Created: ${new Date(ticket.dateCreated).toLocaleDateString()}</small>
                <div class="mt-1">${tags}</div>
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

    const renderKnowledgeBase = () => {
        const searchTerm = kbSearch.value.toLowerCase();
        const selectedCategory = kbCategory.value;
        
        let filteredArticles = knowledgeBaseArticles.filter(article => {
            const matchesSearch = !searchTerm || 
                article.title.toLowerCase().includes(searchTerm) ||
                article.content.toLowerCase().includes(searchTerm) ||
                article.tags.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || article.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        knowledgeBaseList.innerHTML = '';
        if (filteredArticles.length === 0) {
            knowledgeBaseList.innerHTML = '<p>No articles found.</p>';
            return;
        }

        filteredArticles.forEach(article => {
            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action';
            item.onclick = () => showKBArticle(article.id);
            
            const tags = article.tags ? article.tags.split(',').map(tag => 
                `<span class="badge bg-secondary me-1">${tag.trim()}</span>`
            ).join('') : '';

            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${article.title}</h6>
                    <small class="text-muted">${article.viewCount} views</small>
                </div>
                <p class="mb-1">${article.content.substring(0, 150)}${article.content.length > 150 ? '...' : ''}</p>
                <div class="d-flex justify-content-between">
                    <small class="text-muted">Category: ${article.category}</small>
                    <div>${tags}</div>
                </div>
            `;
            knowledgeBaseList.appendChild(item);
        });
    };

    const renderKBCategories = () => {
        kbCategory.innerHTML = '<option value="">All Categories</option>';
        kbCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            kbCategory.appendChild(option);
        });
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
            priority: document.getElementById('priority').value,
            tags: document.getElementById('tags').value
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

    // Show ticket details in modal
    window.showTicketDetails = async (ticketId) => {
        currentTicketId = ticketId;
        try {
            const [ticket, comments] = await Promise.all([
                fetch(`/api/tickets`).then(res => res.json()).then(tickets => 
                    tickets.find(t => t.id === ticketId)
                ),
                fetch(`/api/tickets/${ticketId}/comments`).then(res => res.json())
            ]);

            if (!ticket) {
                alert('Ticket not found');
                return;
            }

            const tags = ticket.tags ? ticket.tags.split(',').map(tag => 
                `<span class="badge bg-secondary me-1">${tag.trim()}</span>`
            ).join('') : 'None';

            document.getElementById('ticket-details').innerHTML = `
                <h6>${ticket.title}</h6>
                <p><strong>Description:</strong> ${ticket.description}</p>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Category:</strong> ${ticket.category}</p>
                        <p><strong>Priority:</strong> <span class="badge bg-${getPriorityColor(ticket.priority)}">${ticket.priority}</span></p>
                        <p><strong>Status:</strong> <span class="badge bg-info">${ticket.status}</span></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Created:</strong> ${new Date(ticket.dateCreated).toLocaleString()}</p>
                        <p><strong>Due Date:</strong> ${ticket.dueDate ? new Date(ticket.dueDate).toLocaleString() : 'N/A'}</p>
                        <p><strong>Tags:</strong> ${tags}</p>
                    </div>
                </div>
                ${ticket.slaViolated ? '<div class="alert alert-danger">⚠️ SLA Violated</div>' : ''}
            `;

            renderTicketComments(comments);
            new bootstrap.Modal(document.getElementById('ticketModal')).show();
        } catch (error) {
            console.error('Error fetching ticket details:', error);
            alert('Error loading ticket details');
        }
    };

    // Show knowledge base article
    window.showKBArticle = async (articleId) => {
        try {
            const article = await fetch(`/api/knowledge-base/${articleId}`).then(res => res.json());
            
            const tags = article.tags ? article.tags.split(',').map(tag => 
                `<span class="badge bg-secondary me-1">${tag.trim()}</span>`
            ).join('') : '';

            document.getElementById('kb-article-content').innerHTML = `
                <h4>${article.title}</h4>
                <div class="mb-3">
                    <small class="text-muted">
                        Category: ${article.category} | 
                        Views: ${article.viewCount} | 
                        Last Updated: ${new Date(article.lastUpdated).toLocaleDateString()}
                    </small>
                </div>
                <div class="mb-3">${tags}</div>
                <div class="content">${article.content.replace(/\n/g, '<br>')}</div>
            `;
            
            new bootstrap.Modal(document.getElementById('kbModal')).show();
        } catch (error) {
            console.error('Error fetching article:', error);
            alert('Error loading article');
        }
    };

    const renderTicketComments = (comments) => {
        const commentsContainer = document.getElementById('ticket-comments');
        if (comments.length === 0) {
            commentsContainer.innerHTML = '<p class="text-muted">No comments yet.</p>';
            return;
        }

        commentsContainer.innerHTML = comments.map(comment => `
            <div class="border rounded p-3 mb-2 ${comment.isInternal ? 'bg-light' : ''}">
                <div class="d-flex justify-content-between">
                    <strong>${comment.username}</strong>
                    <small class="text-muted">
                        ${new Date(comment.dateCreated).toLocaleString()}
                        ${comment.isInternal ? '<span class="badge bg-warning ms-2">Internal</span>' : ''}
                    </small>
                </div>
                <p class="mb-0 mt-2">${comment.comment}</p>
            </div>
        `).join('');
    };

    const getPriorityColor = (priority) => {
        return {
            'Critical': 'danger',
            'High': 'warning',
            'Medium': 'info',
            'Low': 'secondary'
        }[priority] || 'secondary';
    };

    // Add comment functionality
    addCommentBtn.addEventListener('click', async () => {
        const commentText = document.getElementById('new-comment').value.trim();
        if (!commentText || !currentTicketId) return;

        try {
            const response = await fetch(`/api/tickets/${currentTicketId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: commentText })
            });

            if (!response.ok) throw new Error('Failed to add comment');

            document.getElementById('new-comment').value = '';
            
            // Refresh comments
            const comments = await fetch(`/api/tickets/${currentTicketId}/comments`).then(res => res.json());
            renderTicketComments(comments);
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Error adding comment');
        }
    });

    // Knowledge base search and filter
    kbSearch.addEventListener('input', renderKnowledgeBase);
    kbCategory.addEventListener('change', renderKnowledgeBase);

    // --- Initial Load ---
    fetchData();
    fetchKnowledgeBase();
});
