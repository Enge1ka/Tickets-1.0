// This file contains shared JavaScript for all admin pages.

// 1. Check user session and role
(async () => {
    try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
            window.location.href = '/login.html'; // Not authenticated
            return;
        }
        const user = await response.json();
        if (user.role === 'user') {
            window.location.href = '/index.html'; // Not authorized for admin section
        }
        // If session is valid, render the navbar
        renderNavbar(user.username);
    } catch (error) {
        window.location.href = '/login.html'; // Error checking session, redirect to login
    }
})();

// 2. Render the shared navigation bar
const renderNavbar = (username) => {
    const navElement = document.getElementById('admin-nav');
    if (!navElement) return;

    const currentPage = window.location.pathname.split('/').pop();

    const navLinks = [
        { href: 'dashboard.html', text: 'Dashboard' },
        { href: 'users.html', text: 'Users' },
        { href: 'settings.html', text: 'Settings' },
        { href: 'reports.html', text: 'Reports' }
    ];

    const linksHtml = navLinks.map(link => `
        <li class="nav-item">
            <a class="nav-link ${currentPage === link.href ? 'active' : ''}" href="${link.href}">${link.text}</a>
        </li>
    `).join('');

    navElement.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container-fluid">
                <a class="navbar-brand" href="dashboard.html">Admin Panel</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavbar">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="adminNavbar">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        ${linksHtml}
                    </ul>
                    <span class="navbar-text me-3">
                        Logged in as: <strong>${username}</strong>
                    </span>
                    <button id="logout-btn" class="btn btn-outline-light">Logout</button>
                </div>
            </div>
        </nav>
    `;

    // Add logout functionality
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });
};
