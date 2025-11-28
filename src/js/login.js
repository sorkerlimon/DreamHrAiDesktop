// Login functionality for DreamHRAi

class LoginManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('loginBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.forgotPassword = document.getElementById('forgotPassword');

        this.init();
    }

    init() {
        // Bind events
        this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        this.forgotPassword.addEventListener('click', this.handleForgotPassword.bind(this));

        // Add input validation on blur
        this.emailInput.addEventListener('blur', this.validateEmail.bind(this));
        this.passwordInput.addEventListener('blur', this.validatePassword.bind(this));

        // Clear errors on input
        this.emailInput.addEventListener('input', () => this.clearError());
        this.passwordInput.addEventListener('input', () => this.clearError());
    }

    handleLogin(e) {
        e.preventDefault();

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value.trim();

        // Validate inputs
        if (!this.validateEmail() || !this.validatePassword()) {
            return;
        }

        // Show loading state
        this.setLoading(true);

        // Simulate login process (replace with actual authentication)
        this.authenticateUser(email, password);
    }

    authenticateUser(email, password) {
        // For demo purposes - replace with actual authentication logic
        const validCredentials = [
            { email: 'admin@dreamhrai.com', password: 'admin123' }
        ];

        // Simulate network delay
        setTimeout(() => {
            const isValid = validCredentials.some(cred =>
                cred.email === email && cred.password === password
            );

            if (isValid) {
                this.showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    this.redirectToDashboard(email);
                }, 1000);
            } else {
                this.showError('Invalid email or password. Please try again.');
                this.setLoading(false);
            }
        }, 1500); // Simulate 1.5 second loading time
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            this.showError('Email address is required');
            return false;
        }

        if (!emailRegex.test(email)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        return true;
    }

    validatePassword() {
        const password = this.passwordInput.value;

        if (!password) {
            this.showError('Password is required');
            return false;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return false;
        }

        return true;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('show');
    }

    showSuccess(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('show');
        this.errorMessage.style.color = '#27ae60'; // Green color for success
    }

    clearError() {
        this.errorMessage.classList.remove('show');
        this.errorMessage.style.color = '#e74c3c'; // Reset to error color
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.loginBtn.disabled = true;
            this.loginBtn.innerHTML = '<span class="loading"></span>Signing In...';
        } else {
            this.loginBtn.disabled = false;
            this.loginBtn.innerHTML = 'Sign In';
        }
    }

    redirectToDashboard(email) {
        // Send message to main process to switch to dashboard
        if (window.electronAPI && window.electronAPI.loginSuccess) {
            window.electronAPI.loginSuccess(email);
        } else {
            // Fallback: directly load dashboard (for development)
            window.location.href = 'index.html';
        }
    }

    handleForgotPassword(e) {
        e.preventDefault();
        // For demo purposes - show alert
        alert('Password reset functionality will be implemented soon.\n\nContact your administrator for assistance.');
    }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to submit form
    if (e.ctrlKey && e.key === 'Enter') {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    }

    // Escape to clear form
    if (e.key === 'Escape') {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        if (emailInput && passwordInput) {
            emailInput.value = '';
            passwordInput.value = '';
            emailInput.focus();
        }
    }
});
