let db;

// ========== Основные функции ==========

async function initApp() {
    // Проверка авторизации
    if (!localStorage.getItem('isAuth')) {
        window.location.href = 'index.html';
        return;
    }

    // Установка информации о пользователе
    const userRole = localStorage.getItem('userRole');
    document.getElementById('userRole').textContent = userRole === 'admin' ? 'Администратор' : 'Пользователь';
    document.getElementById('currentUser').textContent = userRole === 'admin' ? 'Администратор' : 'Пользователь';

    // Инициализация базы данных
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        db = new SQL.Database();
        initDatabase();
        loadContacts();
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        alert('Произошла ошибка при загрузке приложения');
    }
}

function initDatabase() {
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

    // Добавляем тестовые данные если таблица пуста
    const result = db.exec("SELECT COUNT(*) FROM contacts");
    if (result[0].values[0][0] === 0) {
        const stmt = db.prepare(`
            INSERT INTO contacts (fullName, position, department, phone, email) 
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const testContacts = [
            ["Иванов Иван Иванович", "Разработчик", "IT", "+7 (123) 456-7890", "ivanov@example.com"],
            ["Петрова Анна Сергеевна", "Бухгалтер", "Бухгалтерия", "+7 (987) 654-3210", "petrova@example.com"]
        ];
        
        testContacts.forEach(contact => stmt.run(contact));
        stmt.free();
    }
}

function loadContacts(filter = '') {
    const query = filter 
        ? `SELECT * FROM contacts WHERE 
           fullName LIKE '%${filter}%' OR 
           position LIKE '%${filter}%' OR
           department LIKE '%${filter}%'`
        : "SELECT * FROM contacts";
    
    const result = db.exec(query);
    const tbody = document.getElementById('contactsList');
    tbody.innerHTML = '';

    if (!result.length || result[0].values.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Нет контактов</td></tr>';
        document.getElementById('contactsCount').textContent = '0 контактов';
        return;
    }

    const contacts = result[0].values;
    document.getElementById('contactsCount').textContent = `${contacts.length} ${getContactsWord(contacts.length)}`;

    const userRole = localStorage.getItem('userRole');

    contacts.forEach(contact => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${contact[1]}</td>
            <td>${contact[2]}</td>
            <td>${contact[3]}</td>
            <td>${contact[4]}</td>
            <td>${contact[5]}</td>
            <td>
                ${userRole === 'admin' ? `
                <button class="action-btn edit-btn" data-id="${contact[0]}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${contact[0]}">
                    <i class="fas fa-trash"></i>
                </button>
                ` : '<span class="view-only">Только просмотр</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Назначаем обработчики для кнопок в таблице
    if (userRole === 'admin') {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editContact(parseInt(btn.dataset.id)));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteContact(parseInt(btn.dataset.id)));
        });
    }
}

function getContactsWord(count) {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'контактов';
    if (lastDigit === 1) return 'контакт';
    if (lastDigit >= 2 && lastDigit <= 4) return 'контакта';
    return 'контактов';
}

// ========== Обработчики событий ==========

function setupEventListeners() {
    // Кнопка выхода
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Кнопка добавления контакта
    document.getElementById('addContactBtn').addEventListener('click', showAddModal);
    
    // Поиск контактов
    document.getElementById('searchInput').addEventListener('input', (e) => {
        loadContacts(e.target.value);
    });
    
    // Фильтр по отделам
    document.getElementById('departmentFilter').addEventListener('change', (e) => {
        loadContacts(e.target.value);
    });
    
    // Закрытие модального окна
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('contactModal')) {
            closeModal();
        }
    });
    
    // Форма сохранения контакта
    document.getElementById('contactForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveContact();
    });
}

// ========== Функции для работы с контактами ==========

function showAddModal() {
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Добавить контакт';
    document.getElementById('contactForm').reset();
    document.getElementById('contactId').value = '';
    document.getElementById('contactModal').style.display = 'flex';
}

function editContact(id) {
    const result = db.exec("SELECT * FROM contacts WHERE id = ?", [id]);
    
    if (result.length === 0 || result[0].values.length === 0) {
        alert('Контакт не найден');
        return;
    }
    
    const contact = result[0].values[0];
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-edit"></i> Редактировать контакт';
    document.getElementById('contactId').value = contact[0];
    document.getElementById('fullName').value = contact[1];
    document.getElementById('position').value = contact[2];
    document.getElementById('department').value = contact[3];
    document.getElementById('phone').value = contact[4];
    document.getElementById('email').value = contact[5];
    document.getElementById('contactModal').style.display = 'flex';
}

function deleteContact(id) {
    if (confirm('Вы уверены, что хотите удалить этот контакт?')) {
        db.run("DELETE FROM contacts WHERE id = ?", [id]);
        loadContacts(document.getElementById('searchInput').value);
    }
}

function saveContact() {
    const id = document.getElementById('contactId').value;
    const fullName = document.getElementById('fullName').value;
    const position = document.getElementById('position').value;
    const department = document.getElementById('department').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    
    if (!fullName || !position || !department || !phone || !email) {
        alert('Все поля должны быть заполнены');
        return;
    }
    
    if (id) {
        // Обновление контакта
        db.run(
            "UPDATE contacts SET fullName = ?, position = ?, department = ?, phone = ?, email = ? WHERE id = ?",
            [fullName, position, department, phone, email, id]
        );
    } else {
        // Добавление нового контакта
        db.run(
            "INSERT INTO contacts (fullName, position, department, phone, email) VALUES (?, ?, ?, ?, ?)",
            [fullName, position, department, phone, email]
        );
    }
    
    closeModal();
    loadContacts(document.getElementById('searchInput').value);
}

function closeModal() {
    document.getElementById('contactModal').style.display = 'none';
}

function logout() {
    localStorage.removeItem('isAuth');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);