class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.setupAuthListeners();
        this.checkAuthState();
    }

    setupAuthListeners() {
        // Обработчик формы входа
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Обработчик выхода
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        try {
            if (this.validateCredentials(email, password)) {
                this.isAuthenticated = true;
                localStorage.setItem('adminAuthenticated', 'true');
                this.showAdminContent();
            } else {
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.style.display = 'block';
        }
    }

    validateCredentials(email, password) {
        // Простая проверка логина и пароля
        const validCredentials = [
            { login: 'admin', password: 'admin123' },
            { login: 'ddn', password: 'ddn2024' }
        ];

        return validCredentials.some(cred => 
            cred.login === email && cred.password === password
        );
    }

    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('adminAuthenticated');
        this.showLoginForm();
    }

    checkAuthState() {
        const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
        if (isAuthenticated) {
            this.isAuthenticated = true;
            this.showAdminContent();
        } else {
            this.showLoginForm();
        }
    }

    showAdminContent() {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        
        // Инициализируем календарь только после авторизации
        if (typeof initCalendarAdmin === 'function') {
            initCalendarAdmin();
        }
    }

    showLoginForm() {
        document.getElementById('loginModal').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) errorDiv.style.display = 'none';
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
    }
}

// Инициализация авторизации
let authManager;

document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});

// Функция для инициализации календаря после авторизации
function initCalendarAdmin() {
    if (typeof CalendarAdmin !== 'undefined') {
        window.calendarAdmin = new CalendarAdmin();
    }
}