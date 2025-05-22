// Обработчик формы входа
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    
    // Простая проверка логина и пароля
    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('isAuth', 'true');
        localStorage.setItem('userRole', 'admin');
        window.location.href = 'dashboard.html';
    } 
    else if (username === 'user' && password === 'user123') {
        localStorage.setItem('isAuth', 'true');
        localStorage.setItem('userRole', 'user');
        window.location.href = 'dashboard.html';
    }
    else {
        errorElement.textContent = 'Неверный логин или пароль';
        errorElement.style.display = 'block';
    }
});