 // Firebase Configuration
const firebaseConfig = {
    databaseURL: "https://yuanexchange-2fe09-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Default Settings
let settings = {
    ali: { t1: 13.1, t2: 13.0, t3: 12.9 },
    we: { t1: 13.2, t2: 13.1, t3: 13.0 },
    promo: "Курс жаңыртылууда...",
    promoRates: { r1: "--", r2: "--", r3: "--" },
    bank: { name: "MBANK", number: "0998792579", owner: "Алмаз Т." },
    channelLink: "https://t.me/yuan_exchange",
    support: { whatsapp: "996990032007", telegram: "Temka007z" },
    services: []
};

// Global Variables
let currentApp = 'Alipay';
let currentLang = 'ky';
let selectedRevType = 'pos';
let currentUser = null;
let pageHistory = ['page-home'];