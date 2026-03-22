// Firebase Data Listeners
db.ref('exchangeSettings').on('value', (snapshot) => {
    if (snapshot.exists()) {
        settings = snapshot.val();
        updateUI();
    }
});

function updateUI() {
    // Update promo section
    const promoDiv = document.getElementById('promo-display');
    if (promoDiv) promoDiv.innerText = settings.promo || translations[currentLang].hello;
    
    // Update promo rates
    if (settings.promoRates) {
        document.getElementById('p-rate-1').innerText = settings.promoRates.r1 + " c";
        document.getElementById('p-rate-2').innerText = settings.promoRates.r2 + " c";
        document.getElementById('p-rate-3').innerText = settings.promoRates.r3 + " c";
    }
    
    // Update bank details
    if (settings.bank) {
        document.getElementById('bank-title').innerText = settings.bank.name || "MBANK";
        document.getElementById('bank-number').innerText = settings.bank.number || "0998792579";
        const ownerSpan = document.querySelector('.bank-owner');
        if (ownerSpan) ownerSpan.innerText = settings.bank.owner || "";
    }
    
    calculate('som');
    loadCourseLinks();
    loadSupportLinks();
    loadServicesList();
    loadChannelLink();
}

function loadCourseLinks() {
    const div = document.getElementById('course-links');
    if (!div) return;
    const t = translations[currentLang];
    div.innerHTML = `
        <a href="https://t.me/alipei_2026" target="_blank" class="service-btn">
            <i class="fab fa-alipay"></i> ${t.alipay_course}
        </a>
        <a href="https://t.me/+U8EZ2msYrqoyMDUy" target="_blank" class="service-btn">
            <i class="fas fa-shopping-cart"></i> ${t.pinduoduo_course}
        </a>
    `;
}

function loadSupportLinks() {
    const div = document.getElementById('support-links');
    if (!div) return;
    const t = translations[currentLang];
    const whatsapp = settings.support?.whatsapp || '996990032007';
    const telegram = settings.support?.telegram || 'Temka007z';
    div.innerHTML = `
        <a href="https://wa.me/${whatsapp}" target="_blank" class="support-item">
            <i class="fab fa-whatsapp" style="color:#25D366; font-size:24px;"></i>
            <div>
                <strong>${t.whatsapp_support}</strong><br>
                <small>${whatsapp}</small>
            </div>
        </a>
        <a href="https://t.me/${telegram}" target="_blank" class="support-item">
            <i class="fab fa-telegram" style="color:#0088cc; font-size:24px;"></i>
            <div>
                <strong>${t.telegram_support}</strong><br>
                <small>@${telegram}</small>
            </div>
        </a>
    `;
}

function loadChannelLink() {
    const link = document.getElementById('channel-link');
    if (link) {
        link.href = settings.channelLink || "https://t.me/yuan_exchange";
    }
}

function loadServicesList() {
    db.ref('services').on('value', (snapshot) => {
        const div = document.getElementById('services-container');
        if (!div) return;
        div.innerHTML = "";
        snapshot.forEach((child) => {
            const svc = child.val();
            div.innerHTML += `
                <a href="${svc.link}" target="_blank" class="service-btn">
                    <i class="fas fa-link"></i> ${svc.name}
                </a>
            `;
        });
        if (!snapshot.exists()) {
            div.innerHTML = `<p style="text-align:center; color:var(--grey);">${translations[currentLang].no_rev}</p>`;
        }
    });
}

function calculate(type) {
    const somInput = document.getElementById('som-input');
    const yuanInput = document.getElementById('yuan-input');
    const rateDisplay = document.getElementById('current-rate');
    
    if (!somInput || !yuanInput || !rateDisplay) return;
    
    const rates = (currentApp === 'Alipay') ? settings.ali : settings.we;
    
    if (type === 'som') {
        let som = parseFloat(somInput.value);
        if (isNaN(som) || som <= 0) {
            yuanInput.value = "";
            rateDisplay.innerText = "0.00";
            return;
        }
        let rate = som < 2000 ? rates.t1 : (som < 15000 ? rates.t2 : rates.t3);
        let yuan = (som / rate).toFixed(2);
        yuanInput.value = yuan;
        rateDisplay.innerText = rate;
    } else {
        let yuan = parseFloat(yuanInput.value);
        if (isNaN(yuan) || yuan <= 0) {
            somInput.value = "";
            rateDisplay.innerText = "0.00";
            return;
        }
        let rate = yuan < 150 ? rates.t1 : (yuan < 1100 ? rates.t2 : rates.t3);
        let som = Math.round(yuan * rate);
        somInput.value = som;
        rateDisplay.innerText = rate;
    }
}

function setVal(type, val) {
    const input = document.getElementById(type + '-input');
    if (input) {
        input.value = val;
        calculate(type);
    }
}

function focusInput(inputId) {
    const el = document.getElementById(inputId);
    if (el) {
        el.value = "";
        el.focus();
    }
}

function setApp(app) {
    currentApp = app;
    const aliBtn = document.getElementById('ali-btn');
    const weBtn = document.getElementById('we-btn');
    if (aliBtn) aliBtn.classList.toggle('active', app === 'Alipay');
    if (weBtn) weBtn.classList.toggle('active', app === 'WeChat');
    calculate('som');
}

function sendOrder() {
    const t = translations[currentLang];
    const som = document.getElementById('som-input')?.value;
    const yuan = document.getElementById('yuan-input')?.value;
    
    if (!som || !yuan || parseFloat(som) <= 0 || parseFloat(yuan) <= 0) {
        alert(t.alert_fill);
        return;
    }
    
    db.ref('orders').push({
        amountSom: som,
        amountYuan: yuan,
        app: currentApp,
        date: new Date().toLocaleString(),
        userId: currentUser?.code || 'guest'
    });
    
    const text = `Саламатсызбы! Юань алгым келет:\nСумма: ${som} сом -> ${yuan} ¥\nТиркеме: ${currentApp}`;
    const whatsapp = settings.support?.whatsapp || '996990032007';
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
}

function copyNum() {
    const t = translations[currentLang];
    const num = settings.bank?.number || "0998792579";
    navigator.clipboard.writeText(num).then(() => {
        const toast = document.getElementById('copy-toast');
        if (toast) {
            toast.innerText = t.copy_success;
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 2000);
        }
    });
}

function toggleMenu(close = false) {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    if (!menu || !overlay) return;
    
    if (close) {
        menu.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.style.display = pageId === 'page-home' ? 'none' : 'flex';
    }
    
    pageHistory.push(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toggleMenu(true);
    
    if (pageId === 'page-reviews') loadReviews();
}

function goBack() {
    if (pageHistory.length > 1) {
        pageHistory.pop();
        const prevPage = pageHistory[pageHistory.length - 1];
        showPage(prevPage);
    } else {
        showPage('page-home');
    }
}

function setRevType(type) {
    selectedRevType = type;
    const posBtn = document.getElementById('type-pos');
    const negBtn = document.getElementById('type-neg');
    if (posBtn) posBtn.classList.toggle('selected', type === 'pos');
    if (negBtn) negBtn.classList.toggle('selected', type === 'neg');
}

function submitReview() {
    const t = translations[currentLang];
    const name = document.getElementById('rev-name')?.value.trim();
    const text = document.getElementById('rev-text')?.value.trim();
    
    if (!name || !text) {
        alert(t.alert_rev_err);
        return;
    }
    
    db.ref('reviews').push({
        name: name,
        text: text,
        type: selectedRevType,
        date: new Date().toISOString()
    }).then(() => {
        document.getElementById('rev-name').value = "";
        document.getElementById('rev-text').value = "";
        alert(t.alert_rev_ok);
    });
}

function loadReviews() {
    db.ref('reviews').on('value', (snapshot) => {
        const container = document.getElementById('reviews-container');
        if (!container) return;
        
        container.innerHTML = "";
        
        if (!snapshot.exists()) {
            container.innerHTML = `<p style='text-align:center; color:var(--grey);'>${translations[currentLang].no_rev}</p>`;
            return;
        }
        
        const reviews = [];
        snapshot.forEach(child => {
            reviews.push({ id: child.key, ...child.val() });
        });
        
        // Show newest first
        reviews.reverse().forEach(r => {
            const emoji = r.type === 'neg' ? '😾' : '😻';
            const borderColor = r.type === 'neg' ? 'var(--danger)' : 'var(--success)';
            const date = r.date ? new Date(r.date).toLocaleDateString() : '';
            
            container.innerHTML += `
                <div class="review-card" style="border-left-color: ${borderColor};">
                    <div class="rev-header">
                        <strong>${emoji} ${escapeHtml(r.name)}</strong>
                        <span class="rev-date">${date}</span>
                    </div>
                    <p class="rev-body">${escapeHtml(r.text)}</p>
                </div>
            `;
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function switchLang(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    // Update all text elements
    const elements = {
        'lbl-send': t.send,
        'lbl-receive': t.receive,
        'btn-main': t.main_btn,
        'step-1': t.s1,
        'step-2': t.s2,
        'step-3': t.s3,
        'txt-today-rate': t.today_rate,
        'txt-r-1': t.r1,
        'txt-r-2': t.r2,
        'txt-r-3': t.r3,
        'txt-cur-rate': t.cur_rate,
        'btn-other-s': t.other,
        'btn-other-y': t.other,
        'btn-copy': t.copy,
        'guide-title': t.guide_t,
        'g-step-1': t.g1,
        'g-step-2': t.g2,
        'g-step-3': t.g3,
        'btn-back-1': t.back,
        'btn-back-2': t.back,
        'reviews-title': t.rev_t,
        'add-rev-title': t.add_rev,
        'rev-name': t.name_ph,
        'rev-text': t.text_ph,
        'btn-submit-rev': t.submit,
        'type-pos': t.pos,
        'type-neg': t.neg,
        'm-home': t.m_home,
        'm-guide': t.m_guide,
        'm-course': t.m_course,
        'm-support': t.m_support,
        'm-channel': t.m_channel,
        'm-services': t.m_services,
        'm-reviews': t.m_rev,
        'm-logout': t.logout,
        'course-title': t.course_title,
        'support-title': t.support_title,
        'channel-title': t.channel_title,
        'services-title': t.services_title
    };
    
    for (const [id, text] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
            el.innerText = text;
        } else if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
            el.placeholder = text;
        }
    }
    
    // Update placeholder for rev-name
    const revNameInput = document.getElementById('rev-name');
    if (revNameInput) revNameInput.placeholder = t.name_ph;
    
    // Update auth modal texts if visible
    const authTitle = document.getElementById('auth-title');
    if (authTitle) authTitle.innerText = t.auth_title;
    
    const regBtn = document.getElementById('reg-btn');
    if (regBtn) regBtn.innerText = t.register_btn;
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.innerText = t.login_btn;
    
    const switchToLogin = document.getElementById('switch-to-login');
    if (switchToLogin) switchToLogin.innerText = t.have_account;
    
    const switchToReg = document.getElementById('switch-to-reg');
    if (switchToReg) switchToReg.innerText = t.no_account;
    
    // Update lang buttons
    const kyBtn = document.getElementById('btn-ky');
    const ruBtn = document.getElementById('btn-ru');
    if (kyBtn) kyBtn.classList.toggle('active', lang === 'ky');
    if (ruBtn) ruBtn.classList.toggle('active', lang === 'ru');
    
    // Update dynamic content
    updateUserInterface();
    loadCourseLinks();
    loadSupportLinks();
    loadReviews();
    
    localStorage.setItem('lang', lang);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

function adminTrigger() {
    let clicks = parseInt(localStorage.getItem('adminClick') || '0') + 1;
    localStorage.setItem('adminClick', clicks);
    if (clicks === 3) {
        const password = prompt("Админ пароль:");
        if (password === "777") {
            window.location.href = "admin.html";
        }
        localStorage.setItem('adminClick', '0');
    }
}

// Initialize
window.onload = () => {
    // Check dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
    }
    
    // Check language
    const savedLang = localStorage.getItem('lang');
    if (savedLang) {
        switchLang(savedLang);
    } else {
        switchLang('ky');
    }
    
    // Check auth
    checkAuth();
    
    // Load initial data
    updateUI();
    loadReviews();
    
    // Admin trigger on hello click
    const helloElement = document.getElementById('txt-hello');
    if (helloElement) {
        helloElement.onclick = adminTrigger;
    }
};

// Export functions to global scope
window.switchLang = switchLang;
window.toggleDarkMode = toggleDarkMode;
window.toggleMenu = toggleMenu;
window.showPage = showPage;
window.goBack = goBack;
window.setVal = setVal;
window.focusInput = focusInput;
window.setApp = setApp;
window.calculate = calculate;
window.sendOrder = sendOrder;
window.copyNum = copyNum;
window.setRevType = setRevType;
window.submitReview = submitReview;
window.handleWelcomeClick = handleWelcomeClick;
window.logout = logout;
window.register = register;
window.login = login;
window.toggleAuthForm = toggleAuthForm;
window.closeAuthModal = closeAuthModal;
window.adminTrigger = adminTrigger;