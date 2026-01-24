/* =========================================
   MAIN APP LOGIC (js/main.js)
   ========================================= */

// 1. BOTTOM NAVIGATION (Tab Switcher)
function openTab(tabId, navElement) {
    // A. Saare Content Sections Chupao
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });

    // B. Requested Tab Dikhao
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // === HEADER LOGIC (Fix: Show only on Home) ===
    const header = document.querySelector('.top-header');
    
    if (tabId === 'home') {
        // Agar Home hai to Header dikhao
        if(header) header.style.display = 'flex';
        // Header ke liye upar jagah banao
        document.body.style.paddingTop = '70px'; 
    } else {
        // Baaki tabs par Header chupao
        if(header) header.style.display = 'none';
        // Upar ka gap kam karo (taki content upar se shuru ho)
        document.body.style.paddingTop = '20px'; 
    }

    // C. Bottom Nav Icons Update Karo
    if (navElement) {
        // Sabse active class hatao
        document.querySelectorAll('.nav-item-custom').forEach(item => {
            item.classList.remove('active');
        });
        // Click kiye gaye icon par active lagao
        navElement.classList.add('active');
    }
}

// 2. SUB-PAGE NAVIGATION (Settings, Edit Profile)
function openSubPage(pageId) {
    // Main sections chupao
    document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
    
    // Header bhi chupao (Subpages par apna back button hota hai)
    const header = document.querySelector('.top-header');
    if(header) header.style.display = 'none';
    document.body.style.paddingTop = '0px';

    // Subpage dikhao
    const page = document.getElementById(pageId);
    if(page) {
        page.style.display = 'block';
        window.scrollTo(0, 0);
    }
}

function closeSubPage() {
    // Sub-pages band karo
    document.getElementById('app-settings').style.display = 'none';
    document.getElementById('account-center').style.display = 'none';
    
    // Wapas Profile Tab par jao
    openTab('profile', document.querySelector("div[onclick*='profile']"));
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
    
    // Toggle switch UI update (agar settings me ho)
    const toggleBtn = document.querySelector('.toggle'); 
    if(toggleBtn) {
        if(!isDark) toggleBtn.parentElement.classList.add('active');
        else toggleBtn.parentElement.classList.remove('active');
    }
}

// 4. STUDY TAB SUB-VIEWS (Notes, Books logic)
function openStudySubView(viewId) {
    document.getElementById('study-main-grid').style.display = 'none';
    const view = document.getElementById(viewId);
    if(view) view.style.display = 'block';
}

function closeStudySubView() {
    document.querySelectorAll('.study-sub-view').forEach(el => el.style.display = 'none');
    document.getElementById('study-main-grid').style.display = 'block';
}

// 5. AUTH (Login/Logout Simulation)
function handleLogin() {
    // Login screen chupao, App dikhao
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    // By default Home tab kholo
    openTab('home', document.querySelector('.nav-item-custom.active'));
}

function handleLogout() {
    // App chupao, Login screen dikhao
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

// 6. INITIALIZATION (Jab App start ho)
document.addEventListener('DOMContentLoaded', () => {
    // Theme load karo
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Agar pehle se Dark mode tha to button on rakho
    if (savedTheme === 'dark') {
        const toggleBtn = document.querySelector('.toggle');
        if(toggleBtn) toggleBtn.parentElement.classList.add('active');
    }

    // Default Tab Fix (Home par header dikhao)
    const header = document.querySelector('.top-header');
    if(header) {
        header.style.display = 'flex';
        document.body.style.paddingTop = '70px';
    }
});
