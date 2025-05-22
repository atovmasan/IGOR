// Данные пользователей
const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'user', password: 'user123', role: 'user' }
];

// Проверка авторизации
function checkAuth() {
    const currentPage = window.location.pathname.split('/').pop();
    const user = localStorage.getItem('currentUser');

    if (currentPage === 'index.html' && user) {
        window.location.href = 'dashboard.html';
        return false;
    }

    if (currentPage === 'dashboard.html' && !user) {
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

// Инициализация страницы входа
function initLoginPage() {
    if (!checkAuth()) return;

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorElement = document.getElementById('loginError');
            
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify({
                    username: user.username,
                    role: user.role
                }));
                window.location.href = 'dashboard.html';
            } else {
                errorElement.textContent = 'Неверный логин или пароль';
                errorElement.style.display = 'block';
            }
        });
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html') {
        initLoginPage();
    }
});