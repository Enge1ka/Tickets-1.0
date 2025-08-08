document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const user = await response.json();

            // Redirect based on role
            if (user.role === 'admin' || user.role === 'tech') {
                window.location.href = '/admin.html';
            } else {
                window.location.href = '/index.html';
            }

        } catch (error) {
            errorMessage.textContent = error.message;
            console.error('Login error:', error);
        }
    });
});
