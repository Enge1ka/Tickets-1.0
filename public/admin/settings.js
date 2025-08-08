document.addEventListener('DOMContentLoaded', () => {
    // State
    let allDepartments = [];

    // --- Element Selectors ---
    const departmentList = document.getElementById('department-list');
    const createDepartmentForm = document.getElementById('create-department-form');

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
            item.className = 'list-group-item';
            item.textContent = dept.name;
            departmentList.appendChild(item);
        });
    };

    // --- Event Handlers ---
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

    // --- Initial Load ---
    fetchDepartments();
});
