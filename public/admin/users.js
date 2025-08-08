document.addEventListener('DOMContentLoaded', () => {
    // State
    let allUsers = [];
    let allDepartments = [];
    let editUserModal;

    // --- Element Selectors ---
    const userList = document.getElementById('user-list');
    const createUserForm = document.getElementById('create-user-form');
    const editUserForm = document.getElementById('edit-user-form');

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            const [usersRes, deptsRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/departments')
            ]);
            allUsers = await usersRes.json();
            allDepartments = await deptsRes.json();
            renderAll();
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    // --- Rendering ---
    const renderAll = () => {
        renderUserList();
        populateDepartmentDropdowns();
        populateRoleDropdowns();
    };

    const renderUserList = () => {
        userList.innerHTML = '';
        allUsers.forEach(user => {
            const department = allDepartments.find(d => d.id === user.departmentId) || { name: 'N/A' };
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div>
                    <strong>${user.username}</strong> (${user.role})
                    <br>
                    <small>${department.name}</small>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="openEditModal(${user.id})">Edit</button>
            `;
            userList.appendChild(item);
        });
    };

    const populateDepartmentDropdowns = (selectedId = null) => {
        const createSelect = document.getElementById('new-department');
        const editSelect = document.getElementById('edit-department');
        [createSelect, editSelect].forEach(select => {
            if (!select) return;
            select.innerHTML = allDepartments.map(d => `<option value="${d.id}" ${d.id === selectedId ? 'selected' : ''}>${d.name}</option>`).join('');
        });
    };

    const populateRoleDropdowns = (selectedRole = null) => {
        const roles = ['user', 'tech', 'admin'];
        const createSelect = document.getElementById('new-role');
        const editSelect = document.getElementById('edit-role');
        [createSelect, editSelect].forEach(select => {
            if (!select) return;
            select.innerHTML = roles.map(r => `<option value="${r}" ${r === selectedRole ? 'selected' : ''}>${r}</option>`).join('');
        });
    };

    // --- Event Handlers & Modal Logic ---
    window.openEditModal = (userId) => {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-password').value = ''; // Clear password field
        populateRoleDropdowns(user.role);
        populateDepartmentDropdowns(user.departmentId);

        if (!editUserModal) {
            editUserModal = new bootstrap.Modal(document.getElementById('edit-user-modal'));
        }
        editUserModal.show();
    };

    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            username: document.getElementById('new-username').value,
            password: document.getElementById('new-password').value,
            role: document.getElementById('new-role').value,
            departmentId: parseInt(document.getElementById('new-department').value, 10)
        };

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create user');

            fetchData(); // Re-fetch all data to update the list
            const modal = bootstrap.Modal.getInstance(document.getElementById('create-user-modal'));
            modal.hide();
            createUserForm.reset();

        } catch (error) {
            console.error(error);
            alert('Error creating user.');
        }
    });

    editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('edit-user-id').value;
        const data = {
            username: document.getElementById('edit-username').value,
            role: document.getElementById('edit-role').value,
            departmentId: parseInt(document.getElementById('edit-department').value, 10)
        };
        const password = document.getElementById('edit-password').value;
        if (password) {
            data.password = password; // Only include password if it's being changed
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update user');

            fetchData(); // Re-fetch all data
            editUserModal.hide();

        } catch (error) {
            console.error(error);
            alert('Error updating user.');
        }
    });

    // --- Initial Load ---
    fetchData();
});
