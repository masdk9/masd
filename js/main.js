/* =========================================
   MAIN APP NAVIGATION & LOGIC
   ========================================= */

// 1. BOTTOM NAVIGATION (Tab Switcher)
function openTab(tabId, navElement) {
    // A. Saare Content Sections Chupao
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => {
        sec.style.display = 'none';
    });

    // B. Requested Tab Dikhao
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Agar 'messages' ya koi sub-page hai jo nav me nahi hai, to niche ka code skip karo
        if(!navElement && tabId === 'messages') return; 
    }

    // C. Bottom Nav Icons Update Karo
    // Agar navElement null hai (jaise header se call hua), to manual dhundo
    if (!navElement) {
        // Find nav item corresponding to tabId (Simple logic based on order or ID)
        // Filhal hum ise ignore kar sakte hain agar user header click kare
        return;
    }

    // Remove 'active' class from all nav items
    const navItems = document.querySelectorAll('.nav-item-custom');
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    // Add 'active' class to clicked item
    if (navElement) {
        navElement.classList.add('active');
    }
}

// 2. SUB-PAGE NAVIGATION (Settings, Edit Profile, etc.)
// Ye pages main tabs ke upar khulte hain
function openSubPage(pageId) {
    // Current View (Main Tabs) ko chupane ki zarurat nahi, 
    // hum bas naye page ko dikha denge (full screen overlay type)
    
    // Lekin clean experience ke liye, hum saare tabs chupa dete hain
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => sec.style.display = 'none');

    // Target Sub-page dikhao
    document.getElementById(pageId).style.display = 'block';
    
    // Window ko top par scroll karo
    window.scrollTo(0, 0);
}

function closeSubPage() {
    // Sub-page band karke wapas 'Profile' tab par jao
    // (Kyuki sub-pages mostly profile se hi khulte hain)
    
    document.getElementById('app-settings').style.display = 'none';
    document.getElementById('account-center').style.display = 'none';
    
    // Profile Tab wapas kholo
    document.getElementById('profile').style.display = 'block';
    
    // Bottom Nav ko wapas Profile par active dikhao
    // (Code logic simplify karne ke liye hum direct openTab call nahi kar rahe taaki loop na bane)
}

// 3. DARK MODE TOGGLE
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const toggleBtn = document.querySelector('.dm-toggle'); // Button animation ke liye

    if (isDark) {
        // Switch to Light
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        
        // Toggle UI update (CSS handle karega, bas class add/remove agar chahiye)
        if(toggleBtn && toggleBtn.parentElement) toggleBtn.parentElement.classList.remove('active');
    } else {
        // Switch to Dark
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        
        if(toggleBtn && toggleBtn.parentElement) toggleBtn.parentElement.classList.add('active');
    }
}

// 4. INITIALIZATION (App Load hone par)
document.addEventListener('DOMContentLoaded', () => {
    // A. Check Saved Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Toggle button status update karo
    if (savedTheme === 'dark') {
        const toggleItem = document.querySelector('.dm-toggle').parentElement;
        if(toggleItem) toggleItem.classList.add('active');
    }

    // B. Default Tab (Home) - HTML me already set hai style="display:block"
    // Lekin safety ke liye ensure kar sakte hain
});

// 5. STUDY TAB SUB-VIEWS (Notes, Books list kholna)
// (Ye logic Study.js me bhi ho sakta tha, par navigation hai to yahan bhi theek hai)
function openStudySubView(viewId) {
    // Main Grid chupao
    document.getElementById('study-main-grid').style.display = 'none';
    
    // Sub view dikhao
    const view = document.getElementById(viewId);
    if(view) view.style.display = 'block';
}

function closeStudySubView() {
    // Saare sub-views chupao
    document.querySelectorAll('.study-sub-view').forEach(el => el.style.display = 'none');
    
    // Main Grid wapas dikhao
    document.getElementById('study-main-grid').style.display = 'block';
}
