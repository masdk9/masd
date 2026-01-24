/* =========================================
   MAIN APP LOGIC (js/main.js)
   ========================================= */

// 1. BOTTOM NAVIGATION (Tab Switcher)
function openTab(tabId, navElement) {
    // A. Saare Content Sections Chupao
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });

    // B. Universal Header ko bhi chupao (Just in case wo khula reh gaya ho)
    const uniHeader = document.getElementById('dynamic-header');
    if(uniHeader) uniHeader.style.display = 'none';

    // C. Requested Tab Dikhao
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // === MAIN HEADER LOGIC (Shahpathi Logo) ===
    const mainHeader = document.getElementById('main-header');
    const bottomNav = document.querySelector('.bottom-nav');
    
    // Bottom nav wapas dikhao (agar sub-page se wapas aaye hain)
    if(bottomNav) bottomNav.style.display = 'flex';

    if (tabId === 'home') {
        // Agar Home hai to Main Header dikhao
        if(mainHeader) mainHeader.style.display = 'flex';
        document.body.style.paddingTop = '70px'; 
    } else {
        // Baaki tabs par Main Header chupao (Clean look)
        if(mainHeader) mainHeader.style.display = 'none';
        document.body.style.paddingTop = '20px'; 
    }

    // D. Bottom Nav Icons Update Karo
    if (navElement) {
        document.querySelectorAll('.nav-item-custom').forEach(item => {
            item.classList.remove('active');
        });
        navElement.classList.add('active');
    }
}

// ===============================================
// 2. UNIVERSAL SUB-PAGE LOGIC (The Main Fix)
// ===============================================

function openSubPage(pageId, pageTitle) {
    // 1. Main UI (Home, Tabs, Bottom Nav) Sab Chupao
    document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
    document.querySelector('.bottom-nav').style.display = 'none';
    
    // Main Logo Header bhi chupao
    const mainHeader = document.getElementById('main-header');
    if(mainHeader) mainHeader.style.display = 'none';

    // 2. Target Page Dikhao (Settings, Profile Edit, etc.)
    const page = document.getElementById(pageId);
    if(page) {
        page.style.display = 'block';
        window.scrollTo(0, 0); // Upar scroll karo
    }

    // 3. UNIVERSAL HEADER SET KARO
    const dynamicHeader = document.getElementById('dynamic-header');
    const dynamicTitle = document.getElementById('dynamic-header-title');

    if (dynamicHeader && dynamicTitle) {
        dynamicTitle.innerText = pageTitle || 'Details'; // Title badlo
        dynamicHeader.style.display = 'flex'; // Header dikhao
    }
}

function closeSubPage() {
    // 1. Universal Header Chupao
    const dynamicHeader = document.getElementById('dynamic-header');
    if(dynamicHeader) dynamicHeader.style.display = 'none';

    // 2. Sare Sub-pages band karo
    const subPages = ['account-center', 'app-settings', 'notes-view', 'books-view', 'search'];
    subPages.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    // 3. Wapas Home ya Profile par jao (Reset Logic)
    // Sabse safe hai ki 'Home' tab khol do, isse header/nav apne aap reset ho jayega
    const homeTabBtn = document.querySelector(".nav-item-custom[onclick*='home']");
    openTab('home', homeTabBtn);
}


// 3. DARK MODE TOGGLE
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
    
    const toggleBtn = document.querySelector('.toggle'); 
    if(toggleBtn) {
        if(!isDark) toggleBtn.parentElement.classList.add('active');
        else toggleBtn.parentElement.classList.remove('active');
    }
}


// 4. STUDY TAB SUB-VIEWS (Notes, Books)
// Ab ye bhi Universal Header use karega!
function openStudySubView(viewId, title) {
    openSubPage(viewId, title);
}

// (closeStudySubView ki ab jarurat nahi hai, kyunki universal 'closeSubPage' ye kaam karega)


// 5. AUTH (Login/Logout Simulation)
function handleLogin() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    // Login ke baad Home kholo
    const homeBtn = document.querySelector(".nav-item-custom[onclick*='home']");
    openTab('home', homeBtn);
}

function handleLogout() {
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('auth-container').style.display = 'block';
}

function switchAuthMode(mode) {
    if(mode === 'signup') {
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('signup-view').style.display = 'block';
    } else {
        document.getElementById('signup-view').style.display = 'none';
        document.getElementById('login-view').style.display = 'block';
    }
}


// 6. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    // Theme load
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    if (savedTheme === 'dark') {
        const toggleBtn = document.querySelector('.toggle');
        if(toggleBtn) toggleBtn.parentElement.classList.add('active');
    }

    // Default State: Agar login nahi hai to auth dikhao, nahi to app
    // (Abhi ke liye maan lete hain user logged out hai)
    // document.getElementById('auth-container').style.display = 'block';
});
