 // ============ AUTH SYSTEM ============

// АДМИН КОДУ (6 орундуу, уникалдуу)
const ADMIN_SECRET_CODE = "197907";

function showAuthModal() {
    const t = translations[currentLang];
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    
    // Формаларды тазалоо
    const regName = document.getElementById('reg-name');
    const regSurname = document.getElementById('reg-surname');
    const regPhone = document.getElementById('reg-phone');
    const loginCode = document.getElementById('login-code');
    const msgDiv = document.getElementById('auth-message');
    
    if (regName) regName.value = '';
    if (regSurname) regSurname.value = '';
    if (regPhone) regPhone.value = '';
    if (loginCode) loginCode.value = '';
    if (msgDiv) msgDiv.innerHTML = '';
    
    // Регистрация формасын көрсөтүү
    const regForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    if (regForm) regForm.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';
    
    modal.style.display = 'flex';
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

function toggleAuthForm() {
    const regForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    if (!regForm || !loginForm) return;
    
    if (regForm.style.display !== 'none') {
        regForm.style.display = 'none';
        loginForm.style.display = 'block';
    } else {
        regForm.style.display = 'block';
        loginForm.style.display = 'none';
    }
    
    const msgDiv = document.getElementById('auth-message');
    if (msgDiv) msgDiv.innerHTML = '';
}

// 4 орундуу колдонуучу коду (1000-9999)
function generateUserCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// WhatsApp номерин текшерүү
function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 15;
}

function showAuthMessage(message, isError = true) {
    const msgDiv = document.getElementById('auth-message');
    if (msgDiv) {
        msgDiv.innerHTML = message;
        msgDiv.className = 'auth-message ' + (isError ? 'error' : 'success');
        setTimeout(() => {
            if (msgDiv.innerHTML === message) {
                msgDiv.innerHTML = '';
            }
        }, 3000);
    }
}

// ============ РЕГИСТРАЦИЯ ============
function register() {
    const t = translations[currentLang];
    
    const name = document.getElementById('reg-name')?.value.trim();
    const surname = document.getElementById('reg-surname')?.value.trim();
    const phone = document.getElementById('reg-phone')?.value.trim();
    
    console.log('Register attempt:', { name, surname, phone });
    
    if (!name || !surname || !phone) {
        showAuthMessage(t.error_fill);
        return;
    }
    
    if (!validatePhone(phone)) {
        showAuthMessage(t.error_phone);
        return;
    }
    
    const code = generateUserCode();
    const userId = Date.now().toString();
    
    const userData = {
        name: name,
        surname: surname,
        phone: phone,
        code: code,
        createdAt: Date.now()
    };
    
    console.log('Saving user:', userData);
    
    // Firebaseге жазуу
    db.ref('users/' + userId).set(userData)
        .then(() => {
            console.log('User saved successfully');
            showAuthMessage(t.reg_success + code, false);
            
            // Автоматтык кирүү
            currentUser = { 
                name: name, 
                surname: surname, 
                phone: phone, 
                code: code,
                id: userId
            };
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            setTimeout(() => {
                closeAuthModal();
                updateUserInterface();
            }, 2000);
        })
        .catch((error) => {
            console.error('Registration error:', error);
            showAuthMessage('Каттоодо ката: ' + error.message);
        });
}

// ============ КИРҮҮ (АДМИН КОДУ МЕНЕН) ============
function login() {
    const t = translations[currentLang];
    const code = document.getElementById('login-code')?.value.trim();
    
    console.log('Login attempt with code:', code);
    
    if (!code) {
        showAuthMessage(t.error_fill);
        return;
    }
    
    // === АДМИН ТЕКШЕРҮҮ (6 орундуу атайын код) ===
    if (code === ADMIN_SECRET_CODE) {
        console.log('Admin login detected! Opening admin panel...');
        // Админ панелин жаңы терезеде ачуу
        window.open('admin.html', '_blank');
        closeAuthModal();
        return;
    }
    
    // === КАДИМКИ КОЛДОНУУЧУНУ ТЕКШЕРҮҮ (4 орундуу код) ===
    // Эгер код 4 орундуу сан болсо, кадимки колдонуучуну изде
    if (/^\d{4}$/.test(code)) {
        db.ref('users').orderByChild('code').equalTo(code).once('value')
            .then((snapshot) => {
                console.log('User query result:', snapshot.exists());
                
                if (snapshot.exists()) {
                    let userData = null;
                    let userId = null;
                    snapshot.forEach((child) => {
                        userData = child.val();
                        userId = child.key;
                    });
                    
                    if (userData) {
                        currentUser = {
                            name: userData.name,
                            surname: userData.surname,
                            phone: userData.phone,
                            code: userData.code,
                            id: userId
                        };
                        localStorage.setItem('user', JSON.stringify(currentUser));
                        
                        showAuthMessage(t.login_welcome + currentUser.name + '!', false);
                        
                        setTimeout(() => {
                            closeAuthModal();
                            updateUserInterface();
                        }, 1500);
                    }
                } else {
                    showAuthMessage(t.login_failed);
                }
            })
            .catch((error) => {
                console.error('Login error:', error);
                showAuthMessage('Кирүүдө ката: ' + error.message);
            });
    } else {
        // Код туура эмес форматта (4 орундуу сан эмес, админ коду да эмес)
        showAuthMessage(t.login_failed);
    }
}

// ============ ЧЫГУУ ============
function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    updateUserInterface();
    if (typeof showPage === 'function') showPage('page-home');
    if (typeof toggleMenu === 'function') toggleMenu(false);
}

// ============ ИНТЕРФЕЙСТИ ЖАҢЫРТУУ ============
function handleWelcomeClick() {
    if (!currentUser) {
        showAuthModal();
    }
}

function updateUserInterface() {
    const t = translations[currentLang];
    const welcomeBlock = document.getElementById('welcome-block');
    const menuUserInfo = document.getElementById('menu-user-info');
    
    console.log('Updating UI, currentUser:', currentUser);
    
    if (currentUser) {
        // Башкы беттеги welcome блок
        if (welcomeBlock) {
            welcomeBlock.innerHTML = `
                <div class="welcome-name">👋 ${t.welcome_back} ${currentUser.name} ${currentUser.surname || ''}!</div>
                <div class="welcome-code">🔑 ${t.enter_code}: <strong>${currentUser.code}</strong></div>
                <div class="welcome-phone">📱 ${currentUser.phone || ''}</div>
            `;
            welcomeBlock.style.cursor = 'default';
        }
        
        // Сайдбардагы колдонуучу маалыматы
        if (menuUserInfo) {
            menuUserInfo.innerHTML = `
                <div class="menu-user-name">${currentUser.name} ${currentUser.surname || ''}</div>
                <div class="menu-user-code">🔑 ${currentUser.code}</div>
                <div class="menu-user-phone" style="font-size: 11px; opacity:0.7;">${currentUser.phone || ''}</div>
            `;
        }
    } else {
        if (welcomeBlock) {
            welcomeBlock.innerHTML = `
                <div class="welcome-login">👋 ${t.login_register}</div>
            `;
            welcomeBlock.style.cursor = 'pointer';
        }
        
        if (menuUserInfo) {
            menuUserInfo.innerHTML = `
                <div class="menu-user-name">${t.welcome}</div>
                <div class="menu-user-code" style="font-size: 12px;">${t.login_register}</div>
            `;
        }
    }
}

function checkAuth() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('Loaded user from localStorage:', currentUser);
        } catch (e) {
            console.error('Error parsing user data:', e);
            currentUser = null;
        }
    }
    updateUserInterface();
}

// Тест үчүн демо колдонуучу түзүү (керек болсо)
function createDemoUser() {
    const demoCode = "1234";
    const demoUser = {
        name: "Тест",
        surname: "Колдонуучу",
        phone: "996700123456",
        code: demoCode,
        id: "demo123"
    };
    
    // Firebaseге сактоо
    db.ref('users/demo123').set(demoUser)
        .then(() => {
            console.log('Demo user created with code: 1234');
            alert('Демо колдонуучу түзүлдү! Коду: 1234');
        })
        .catch(err => console.error('Error:', err));
}

// ============ АДМИН КИРҮҮ ҮЧҮН КОШУМЧА МЕХАНИЗМ ============
// Бул функцияны консоль аркылуу да чакырууга болот
function openAdminPanel() {
    const adminCode = prompt("Админ кодуңузду киргизиңиз:");
    if (adminCode === ADMIN_SECRET_CODE) {
        window.open('admin.html', '_blank');
    } else if (adminCode) {
        alert("Код туура эмес!");
    }
}

// Консольго маалымат чыгаруу (админдер үчүн)
console.log("%c🔒 Админ панелине кирүү үчүн код: " + ADMIN_SECRET_CODE, "color: #5856D6; font-size: 14px; font-weight: bold;");
console.log("%c💡 openAdminPanel() функциясын чакырып да кирсеңиз болот", "color: #34C759; font-size: 12px;");