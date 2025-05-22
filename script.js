let db;

// Проверка авторизации для dashboard
function checkAuth() {
    if (!localStorage.getItem('currentUser')) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Инициализация базы данных
async function initDB() {
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    
    db = new SQL.Database();
    
    // Создание таблицы контактов
    db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT NOT NULL,
            position TEXT NOT NULL,
            department TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL
        )
    `);
    
    // Проверка на пустую таблицу
    const result = db.exec("SELECT COUNT(*) as count FROM contacts");
    if (result[0].values[0][0] === 0) {
        // Добавление тестовых данных
        const stmt = db.prepare(
            "INSERT INTO contacts (fullName, position, department, phone, email) VALUES (?, ?, ?, ?, ?)"
        );
        
        const testContacts = [
            ["Иванов Иван Иванович", "Разработчик", "IT", "+7 (123) 456-7890", "ivanov@example.com"],
            ["Петрова Анна Сергеевна", "Бухгалтер", "Бухгалтерия", "+7 (987) 654-3210", "petrova@example.com"]
        ];
        
        testContacts.forEach(contact => stmt.run(contact));
        stmt.free();
    }
}

// Загрузка контактов
function loadContacts(filter = null) {
    const contactsList = document.getElementById('contactsList');
    contactsList.innerHTML = '';
    
    let query = "SELECT * FROM contacts";
    const params = [];
    
    if (filter) {
        query += " WHERE fullName LIKE ? OR position LIKE ? OR department LIKE ? OR phone LIKE ? OR email LIKE ?";
        const searchTerm = `%${filter}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    const result = db.exec(query, params);
    if (result.length === 0) {
        contactsList.innerHTML = '<tr><td colspan="6">Контакты не найдены</td></tr>';
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    result[0].values.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row[1]}</td>
            <td>${row[2]}</td>
            <td>${row[3]}</td>
            <td>${row[4]}</td>
            <td>${row[5]}</td>
            <td>
                ${currentUser.role === 'admin' ? `
                <button class="action-btn edit-btn" data-id="${row[0]}">
                    <i class="fas fa-edit"></i> Изменить
                </button>
                <button class="action-btn delete-btn" data-id="${row[0]}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
                ` : 'Только просмотр'}
            </td>
        `;
        contactsList.appendChild(tr);
    });
    
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editContact(parseInt(btn.dataset.id)));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteContact(parseInt(btn.dataset.id)));
        });
    }
}

// Остальные функции (editContact, deleteContact, saveContact) аналогичны предыдущим примерам

// Инициализация dashboard
async function initDashboard() {
    if (!checkAuth()) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('currentUser').textContent = currentUser.username;
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Администратор' : 'Пользователь';
    
    try {
        await initDB();
        loadContacts();
        
        // Назначение обработчиков
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
        
        document.getElementById('addContactBtn').addEventListener('click', () => {
            document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Добавить контакт';
            document.getElementById('contactForm').reset();
            document.getElementById('contactId').value = '';
            document.getElementById('contactModal').style.display = 'flex';
        });
        
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('contactModal').style.display = 'none';
        });
        
        document.getElementById('searchBtn').addEventListener('click', () => {
            loadContacts(document.getElementById('searchInput').value);
        });
        
        document.getElementById('departmentFilter').addEventListener('change', function() {
            if (this.value) {
                loadContacts(this.value);
            } else {
                loadContacts();
            }
        });
        
        document.getElementById('contactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            saveContact();
        });
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        alert('Ошибка при загрузке приложения');
    }
}

// Запуск dashboard
document.addEventListener('DOMContentLoaded', initDashboard);