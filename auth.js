// Auth Functions

function showAuthModal() {
    const t = translations[currentLang];
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('auth-title');
    if (title) title.innerText = t.auth_title;
    modal.style.display = 'flex';
    
    // Clear message
    const msgDiv = document.getElementById('auth-message');
    if (msgDiv) msgDiv.innerHTML = '';
    
    // Clear inputs
    const nameInput = document.getElementById('reg-name');
    const surnameInput = document.getElementById('reg-surname');
    const phoneInput = document.getElementById('reg-phone');
    const codeInput = document.getElementById('login-code');
    if (nameInput) nameInput.value = '';
    if (surnameInput) surnameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (codeInput) codeInput.value = '';
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
    const msgDiv = document.getElementById('auth-message');
    if (msgDiv) msgDiv.innerHTML = '';
}

function toggleAuthForm() {
    const regForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    
    if (regForm.style.display !== 'none') {
        regForm.style.display = 'none';
        loginForm.style.display = 'block';
    } else {
        regForm.style.display = 'block';
        loginForm.style.display = 'none';
    }
    
    // Clear message when toggling
    const msgDiv = document.getElementById('auth-message');
    if (msgDiv) msgDiv.innerHTML = '';
}

function generateUserCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function validatePhone(phone) {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's a valid Kyrgyz phone number (starts with 996, 9-12 digits total)
    return cleaned.length >= 9 && cleaned.length <= 12;
}

function showAuthMessage(message, isError = true) {
    const msgDiv = document.getElementById('auth-message');
    if (msgDiv) {
        msgDiv.innerHTML = message;
        msgDiv.className = 'auth-message ' + (isError ? 'error' : 'success');
        setTimeout(() => {
            if (msgDiv.innerHTML === message) {
                msgDiv.innerHTML = '';
                msgDiv.className = 'auth-message';
            }
        }, 3000);
    }
}

function register() {
    const t = translations[currentLang];
    const name = document.getElementById('reg-name')?.value.trim();
    const surname = document.getElementById('reg-surname')?.value.trim();
    const phone = document.getElementById('reg-phone')?.value.trim();
    
    if (!name || !surname || !phone) {
        showAuthMessage(t.error_fill);
        return;
    }
    
    if (!validatePhone(phone)) {
        showAuthMessage(t.error_phone);
        return;
    }
    
    const code = generateUserCode();
    
    db.ref('users').push({
        name: name,
        surname: surname,
        phone: phone,
        code: code,
        createdAt: Date.now()
    }).then(() => {
        showAuthMessage(t.reg_success + code, false);
        
        // Auto login after registration
        currentUser = { name: name, surname: surname, phone: phone, code: code };
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        setTimeout(() => {
            closeAuthModal();
            updateUserInterface();
            showAuthMessage('', false);
        }, 2000);
    }).catch((error) => {
        console.error('Registration error:', error);
        showAuthMessage('Каттоодо ката кетти. Кайра аракет кылыңыз.');
    });
}

function login() {
    const t = translations[currentLang];
    const code = document.getElementById('login-code')?.value.trim();
    
    if (!code) {
        showAuthMessage(t.error_fill);
        return;
    }
    
    db.ref('users').orderByChild('code').equalTo(code).once('value', (snapshot) => {
        if (snapshot.exists()) {
            let userData = null;
            snapshot.forEach((child) => {
                userData = child.val();
                userData.id = child.key;
            });
            
            if (userData) {
                currentUser = {
                    name: userData.name,
                    surname: userData.surname,
                    phone: userData.phone,
                    code: userData.code
                };
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                showAuthMessage(t.login_welcome + currentUser.name + '!', false);
                
                setTimeout(() => {
                    closeAuthModal();
                    updateUserInterface();
                    showAuthMessage('', false);
                }, 1500);
            }
        } else {
            showAuthMessage(t.login_failed);
        }
    }).catch((error) => {
        console.error('Login error:', error);
        showAuthMessage('Кирүүдө ката кетти. Кайра аракет кылыңыз.');
    });
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    updateUserInterface();
    showPage('page-home');
}

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
        // Main page welcome block
        welcomeBlock.innerHTML = `
            <div class="welcome-name">${t.welcome_back} ${currentUser.name} ${currentUser.surname || ''}!</div>
            <div class="welcome-code">🔑 ${t.enter_code}: ${currentUser.code}</div>
        `;
        
        // Sidebar user info
        if (menuUserInfo) {
            menuUserInfo.innerHTML = `
                <div class="menu-user-name">${currentUser.name} ${currentUser.surname || ''}</div>
                <div class="menu-user-code">🔑 ${currentUser.code}</div>
            `;
        }
    } else {
        welcomeBlock.innerHTML = `
            <div class="welcome-login">👋 ${t.login_register}</div>
        `;
        
        if (menuUserInfo) {
            menuUserInfo.innerHTML = `
                <div class="menu-user-name">${t.welcome}</div>
                <div class="menu-user-code" style="font-size: 12px; opacity: 0.8;">${t.login_register}</div>
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