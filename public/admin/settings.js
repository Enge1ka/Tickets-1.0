document.addEventListener('DOMContentLoaded', () => {
    // State
    let allDepartments = [];
    let editDepartmentModal;

    // --- Element Selectors ---
    const departmentList = document.getElementById('department-list');
    const createDepartmentForm = document.getElementById('create-department-form');
    const editDepartmentForm = document.getElementById('edit-department-form');

    // --- Data Fetching ---
    const fetchDepartments = async () => {
        try {
            const response = await fetch('/api/departments');
            if (!response.ok) throw new Error('Failed to fetch departments');
            allDepartments = await response.json();
            renderDepartments();
        } catch (error) {
            console.error(error);
            departmentList.innerHTML = '<div class="alert alert-danger">Could not load departments.</div>';
        }
    };

    // --- Rendering ---
    const renderDepartments = () => {
        departmentList.innerHTML = '';
        allDepartments.forEach(dept => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <span>${dept.name}</span>
                <button class="btn btn-sm btn-secondary" onclick="openEditModal(${dept.id}, '${dept.name}')">Edit</button>
            `;
            departmentList.appendChild(item);
        });
    };

    // --- Event Handlers & Modal Logic ---
    window.openEditModal = (id, name) => {
        if (!editDepartmentModal) {
            editDepartmentModal = new bootstrap.Modal(document.getElementById('edit-department-modal'));
        }
        document.getElementById('edit-department-id').value = id;
        document.getElementById('edit-department-name').value = name;
        editDepartmentModal.show();
    };

    createDepartmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('new-department-name');
        const name = nameInput.value;

        try {
            const response = await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Failed to create department');

            // Success, re-fetch and reset form
            nameInput.value = '';
            fetchDepartments();

        } catch (error) {
            console.error(error);
            alert('Error creating department.');
        }
    });

    editDepartmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-department-id').value;
        const name = document.getElementById('edit-department-name').value;

        try {
            const response = await fetch(`/api/departments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Failed to update department');

            editDepartmentModal.hide();
            fetchDepartments(); // Re-fetch to update the list

        } catch (error) {
            console.error(error);
            alert('Error updating department.');
        }
    });

    // --- Initial Load ---
    fetchDepartments();
});
