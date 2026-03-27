 // DOM Elements
let somInput, yuanInput, currentRateSpan, rateInfoSpan, promoDisplay;
let aliBtn, weBtn;

// Инициализация
function initDOM() {
    somInput = document.getElementById('som-input');
    yuanInput = document.getElementById('yuan-input');
    currentRateSpan = document.getElementById('current-rate');
    rateInfoSpan = document.getElementById('txt-cur-rate');
    promoDisplay = document.getElementById('promo-display');
    aliBtn = document.getElementById('ali-btn');
    weBtn = document.getElementById('we-btn');
}

// Курс алуу
function getCurrentRate() {
    const amount = parseFloat(somInput?.value) || 0;
    const rates = settings;
    let rate = 0;
    
    if (currentApp === 'Alipay') {
        if (amount < 2000) rate = rates.ali.t1;
        else if (amount < 15000) rate = rates.ali.t2;
        else rate = rates.ali.t3;
    } else {
        if (amount < 2000) rate = rates.we.t1;
        else if (amount < 15000) rate = rates.we.t2;
        else rate = rates.we.t3;
    }
    return rate;
}

// Эсептөө
function calculate(source) {
    if (!somInput || !yuanInput) return;
    
    const rate = getCurrentRate();
    if (currentRateSpan) currentRateSpan.innerText = rate.toFixed(2);
    
    if (source === 'som') {
        const som = parseFloat(somInput.value) || 0;
        const yuan = som / rate;
        yuanInput.value = yuan.toFixed(2);
    } else {
        const yuan = parseFloat(yuanInput.value) || 0;
        const som = yuan * rate;
        somInput.value = som.toFixed(2);
    }
}

function setVal(type, val) {
    if (type === 'som' && somInput) {
        somInput.value = val;
        calculate('som');
    } else if (type === 'yuan' && yuanInput) {
        yuanInput.value = val;
        calculate('yuan');
    }
}

function focusInput(id) {
    const el = document.getElementById(id);
    if (el) el.focus();
}

function setApp(app) {
    currentApp = app;
    if (aliBtn && weBtn) {
        if (app === 'Alipay') {
            aliBtn.classList.add('active');
            weBtn.classList.remove('active');
        } else {
            weBtn.classList.add('active');
            aliBtn.classList.remove('active');
        }
    }
    calculate('som');
}

function copyNum() {
    const bankNum = settings.bank?.number || '';
    if (bankNum) {
        navigator.clipboard.writeText(bankNum);
        const toast = document.getElementById('copy-toast');
        if (toast) {
            toast.style.display = 'flex';
            setTimeout(() => { toast.style.display = 'none'; }, 1500);
        }
    }
}

function sendOrder() {
    const t = translations[currentLang];
    const amountSom = parseFloat(somInput?.value) || 0;
    const amountYuan = parseFloat(yuanInput?.value) || 0;
    
    if (amountSom <= 0) {
        alert(t.alert_fill);
        return;
    }
    
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    const order = {
        userId: currentUser.id,
        userName: currentUser.name,
        userSurname: currentUser.surname || '',
        amountSom: amountSom,
        amountYuan: amountYuan,
        app: currentApp,
        date: new Date().toISOString(),
        status: 'pending'
    };
    
    db.ref('orders').push(order)
        .then(() => {
            const whatsappNumber = settings.support?.whatsapp || '996990032007';
            const message = `Заказ №${Date.now()}\nСумма: ${amountSom} сом = ${amountYuan} ¥\nПриложение: ${currentApp}\nКод: ${currentUser.code}\nИмя: ${currentUser.name} ${currentUser.surname || ''}`;
            window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        })
        .catch(err => console.error('Order error:', err));
}

// UI жаңыртуу (акция блогу жок)
function updateUI() {
    db.ref('exchangeSettings').on('value', (snap) => {
        if (snap.exists()) {
            const data = snap.val();
            settings.ali = data.ali || settings.ali;
            settings.we = data.we || settings.we;
            settings.bank = data.bank || settings.bank;
            settings.channelLink = data.channelLink || settings.channelLink;
            settings.support = data.support || settings.support;
            
            // Акция блогу жок, promoDisplay жашырылды
            if (promoDisplay) {
                promoDisplay.style.display = 'none';
            }
            
            const bankNameSpan = document.querySelector('.bank-name');
            const bankNumberStrong = document.getElementById('bank-number');
            if (bankNameSpan) bankNameSpan.innerText = settings.bank?.name || 'MBANK';
            if (bankNumberStrong) bankNumberStrong.innerText = settings.bank?.number || '0998 792 579';
            
            const rate1 = document.getElementById('p-rate-1');
            const rate2 = document.getElementById('p-rate-2');
            const rate3 = document.getElementById('p-rate-3');
            if (rate1) rate1.innerText = data.promoRates?.r1 || '--';
            if (rate2) rate2.innerText = data.promoRates?.r2 || '--';
            if (rate3) rate3.innerText = data.promoRates?.r3 || '--';
            
            calculate('som');
        }
    });
}

// Пикирлерди жүктөө
function loadReviews() {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    
    db.ref('reviews').on('value', (snap) => {
        const t = translations[currentLang];
        container.innerHTML = '';
        
        if (!snap.exists()) {
            container.innerHTML = `<div class="glass-card" style="text-align:center;">${t.no_rev}</div>`;
            return;
        }
        
        const reviews = [];
        snap.forEach(child => {
            reviews.push({ id: child.key, ...child.val() });
        });
        
        reviews.reverse().forEach(rev => {
            const typeIcon = rev.type === 'neg' ? '😾' : '😻';
            
            const div = document.createElement('div');
            div.className = 'review-card';
            div.style.borderLeftColor = rev.type === 'neg' ? 'var(--danger)' : 'var(--success)';
            div.innerHTML = `
                <div class="rev-header">
                    <span><strong>${rev.name || 'Аноним'}</strong> ${typeIcon}</span>
                    <span class="rev-date">${rev.date ? new Date(rev.date).toLocaleDateString() : ''}</span>
                </div>
                <div class="rev-body">${rev.text || ''}</div>
            `;
            container.appendChild(div);
        });
    });
}

function submitReview() {
    const t = translations[currentLang];
    const name = document.getElementById('rev-name')?.value.trim();
    const text = document.getElementById('rev-text')?.value.trim();
    
    if (!name || !text) {
        alert(t.alert_rev_err);
        return;
    }
    
    const review = {
        name: name,
        text: text,
        type: selectedRevType,
        date: Date.now()
    };
    
    db.ref('reviews').push(review)
        .then(() => {
            alert(t.alert_rev_ok);
            if (document.getElementById('rev-name')) document.getElementById('rev-name').value = '';
            if (document.getElementById('rev-text')) document.getElementById('rev-text').value = '';
        })
        .catch(err => console.error('Review error:', err));
}

function setRevType(type) {
    selectedRevType = type;
    const posBtn = document.getElementById('type-pos');
    const negBtn = document.getElementById('type-neg');
    if (posBtn && negBtn) {
        if (type === 'pos') {
            posBtn.classList.add('selected');
            negBtn.classList.remove('selected');
        } else {
            negBtn.classList.add('selected');
            posBtn.classList.remove('selected');
        }
    }
}

// Услугалар - эми өзүнчө файлда, бул жерде бош
function loadServices() {
    // services.html аркылуу иштейт
}

function loadSupportLinks() {
    const container = document.getElementById('support-links');
    if (!container) return;
    
    db.ref('exchangeSettings').on('value', (snap) => {
        const data = snap.val();
        const support = data?.support || { whatsapp: '996990032007', telegram: 'Temka007z' };
        
        container.innerHTML = `
            <a href="https://wa.me/${support.whatsapp}" target="_blank" class="support-item">
                <i class="fab fa-whatsapp" style="font-size:24px; color:#25D366;"></i>
                <div><strong>WhatsApp</strong><small>${support.whatsapp}</small></div>
            </a>
            <a href="https://t.me/${support.telegram.replace('@', '')}" target="_blank" class="support-item">
                <i class="fab fa-telegram" style="font-size:24px; color:#26A5E4;"></i>
                <div><strong>Telegram</strong><small>@${support.telegram.replace('@', '')}</small></div>
            </a>
        `;
    });
}

function loadChannelLink() {
    const channelLinkElem = document.getElementById('channel-link');
    if (channelLinkElem) {
        db.ref('exchangeSettings/channelLink').on('value', (snap) => {
            if (snap.exists()) {
                channelLinkElem.href = snap.val();
            }
        });
    }
}

// Страницаларды көрсөтүү
function showPage(pageId) {
    const pages = ['page-home', 'page-guide', 'page-course', 'page-support', 'page-channel', 'page-services', 'page-reviews', 'page-my-orders'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.add('active');
    
    pageHistory.push(pageId);
    if (pageHistory.length > 10) pageHistory.shift();
    
    updateBackButton();
    if (typeof toggleMenu === 'function') toggleMenu(false);
}

function updateBackButton() {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        if (pageHistory.length > 1 && pageHistory[pageHistory.length - 1] !== 'page-home') {
            backBtn.style.display = 'block';
        } else {
            backBtn.style.display = 'none';
        }
    }
}

function goBack() {
    if (pageHistory.length > 1) {
        pageHistory.pop();
        const lastPage = pageHistory[pageHistory.length - 1];
        showPage(lastPage);
    }
}

function toggleMenu(forceClose) {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    if (!menu || !overlay) return;
    
    if (forceClose === false) {
        menu.classList.remove('active');
        overlay.classList.remove('active');
    } else if (forceClose === true) {
        menu.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function switchLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    
    const t = translations[lang];
    
    const kyBtn = document.getElementById('btn-ky');
    const ruBtn = document.getElementById('btn-ru');
    if (kyBtn && ruBtn) {
        if (lang === 'ky') {
            kyBtn.classList.add('active');
            ruBtn.classList.remove('active');
        } else {
            ruBtn.classList.add('active');
            kyBtn.classList.remove('active');
        }
    }
    
    const elements = {
        'step-1': t.s1, 'step-2': t.s2, 'step-3': t.s3,
        'lbl-send': t.send, 'lbl-receive': t.receive,
        'btn-other-s': t.other, 'btn-other-y': t.other,
        'btn-main': t.main_btn, 'btn-copy': t.copy,
        'txt-today-rate': t.today_rate, 'txt-r-1': t.r1, 'txt-r-2': t.r2, 'txt-r-3': t.r3,
        'txt-cur-rate': t.cur_rate, 'guide-title': t.guide_t,
        'g-step-1': t.g1, 'g-step-2': t.g2, 'g-step-3': t.g3,
        'btn-back-1': t.back, 'btn-back-2': t.back,
        'course-title': t.course_title, 'support-title': t.support_title,
        'channel-title': t.channel_title, 'services-title': t.services_title,
        'reviews-title': t.rev_t, 'add-rev-title': t.add_rev,
        'rev-name': t.name_ph, 'rev-text': t.text_ph, 'btn-submit-rev': t.submit,
        'auth-title': t.auth_title, 'reg-btn': t.register_btn, 'login-btn': t.login_btn,
        'switch-to-login': t.have_account, 'switch-to-reg': t.no_account,
        'm-home': t.m_home, 'm-guide': t.m_guide, 'm-course': t.m_course,
        'm-support': t.m_support, 'm-channel': t.m_channel, 'm-services': t.m_services,
        'm-reviews': t.m_rev, 'm-logout': t.logout, 'm-div-auth': t.hello
    };
    
    for (const [id, text] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }
    
    const posBtn = document.getElementById('type-pos');
    const negBtn = document.getElementById('type-neg');
    if (posBtn) posBtn.innerHTML = t.pos;
    if (negBtn) negBtn.innerHTML = t.neg;
    
    updateUserInterface();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
    // services.html ичиндеги dark mode синхронизациясы
    try {
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ darkMode: document.body.classList.contains('dark') }, '*');
        }
    } catch(e) {}
}

// Initialize
window.onload = () => {
    console.log('App starting...');
    
    initDOM();
    
    db.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) console.log('Firebase connected!');
    });
    
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');
    
    const savedLang = localStorage.getItem('lang');
    if (savedLang && (savedLang === 'ky' || savedLang === 'ru')) {
        switchLang(savedLang);
    } else {
        switchLang('ky');
    }
    
    checkAuth();
    updateUI();
    loadReviews();
    loadSupportLinks();
    loadChannelLink();
    
    const welcomeBlock = document.getElementById('welcome-block');
    if (welcomeBlock) welcomeBlock.onclick = handleWelcomeClick;
    
    setTimeout(() => calculate('som'), 100);
    console.log('App started successfully!');
};