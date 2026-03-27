 // ============ AUTH SYSTEM ============

// АДМИН КОДУ (6 орундуу, уникалдуу)
const ADMIN_SECRET_CODE = "197907";

// КООПСУЗДУК: XSS коргонуу
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showAuthModal() {
    const t = translations[currentLang];
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    
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

function generateUserCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 15;
}

function showAuthMessage(message, isError = true) {
    const msgDiv = document.getElementById('auth-message');
    if (msgDiv) {
        msgDiv.innerHTML = escapeHtml(message);
        msgDiv.className = 'auth-message ' + (isError ? 'error' : 'success');
        setTimeout(() => {
            if (msgDiv.innerHTML === escapeHtml(message)) {
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
    
    if (!name || !surname || !phone) {
        showAuthMessage(t.error_fill);
        return;
    }
    
    // Узундукту текшерүү
    if (name.length > 50) { showAuthMessage("Атыңыз 50 символдон ашпоого тийиш!"); return; }
    if (surname.length > 50) { showAuthMessage("Фамилияңыз 50 символдон ашпоого тийиш!"); return; }
    if (phone.length > 20) { showAuthMessage("Телефон номери туура эмес!"); return; }
    
    if (!validatePhone(phone)) {
        showAuthMessage(t.error_phone);
        return;
    }
    
    const code = generateUserCode();
    const userId = Date.now().toString();
    
    const userData = {
        name: escapeHtml(name),
        surname: escapeHtml(surname),
        phone: phone.replace(/\D/g, ''),
        code: code,
        createdAt: Date.now()
    };
    
    db.ref('users/' + userId).set(userData)
        .then(() => {
            showAuthMessage(t.reg_success + code, false);
            
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

// ============ КИРҮҮ ============
function login() {
    const t = translations[currentLang];
    const code = document.getElementById('login-code')?.value.trim();
    
    if (!code) {
        showAuthMessage(t.error_fill);
        return;
    }
    
    // АДМИН ТЕКШЕРҮҮ
    if (code === ADMIN_SECRET_CODE) {
        window.open('admin.html', '_blank');
        closeAuthModal();
        return;
    }
    
    // КАДИМКИ КОЛДОНУУЧУ
    if (/^\d{4}$/.test(code)) {
        db.ref('users').orderByChild('code').equalTo(code).once('value')
            .then((snapshot) => {
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
    
    if (currentUser) {
        if (welcomeBlock) {
            welcomeBlock.innerHTML = `
                <div class="welcome-name">👋 ${escapeHtml(t.welcome_back)} ${escapeHtml(currentUser.name)} ${escapeHtml(currentUser.surname || '')}!</div>
                <div class="welcome-code">🔑 ${escapeHtml(t.enter_code)}: <strong>${escapeHtml(currentUser.code)}</strong></div>
                <div class="welcome-phone">📱 ${escapeHtml(currentUser.phone || '')}</div>
            `;
            welcomeBlock.style.cursor = 'default';
        }
        
        if (menuUserInfo) {
            menuUserInfo.innerHTML = `
                <div class="menu-user-name">${escapeHtml(currentUser.name)} ${escapeHtml(currentUser.surname || '')}</div>
                <div class="menu-user-code">🔑 ${escapeHtml(currentUser.code)}</div>
                <div class="menu-user-phone" style="font-size: 11px; opacity:0.7;">${escapeHtml(currentUser.phone || '')}</div>
            `;
        }
    } else {
        if (welcomeBlock) {
            welcomeBlock.innerHTML = `<div class="welcome-login">👋 ${escapeHtml(t.login_register)}</div>`;
            welcomeBlock.style.cursor = 'pointer';
        }
        
        if (menuUserInfo) {
            menuUserInfo.innerHTML = `
                <div class="menu-user-name">${escapeHtml(t.welcome)}</div>
                <div class="menu-user-code" style="font-size: 12px;">${escapeHtml(t.login_register)}</div>
            `;
        }
    }
}

function checkAuth() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            console.error('Error parsing user data:', e);
            currentUser = null;
        }
    }
    updateUserInterface();
}

function openAdminPanel() {
    const adminCode = prompt("Админ кодуңузду киргизиңиз:");
    if (adminCode === ADMIN_SECRET_CODE) {
        window.open('admin.html', '_blank');
    } else if (adminCode) {
        alert("Код туура эмес!");
    }
}

console.log("%c🔒 Админ панелине кирүү үчүн код: " + ADMIN_SECRET_CODE, "color: #5856D6; font-size: 14px; font-weight: bold;");