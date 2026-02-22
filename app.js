/* ═══════════════════════════════════════════════
   DIGINOTES.NET — MAIN APP
   Firebase powered | Real-time posts | Comments
═══════════════════════════════════════════════ */

import {
    fetchPosts, fetchSettings,
    isPostLiked, toggleLike,
    formatNum
} from './firebase-config.js';

/* ══════════════
   IDENTITY
══════════════ */
const ANIMALS = ['🦆','🦊','🐼','🐯','🦁','🐸','🦉','🐺','🦋','🐬','🦅','🐨','🦝','🐮','🦜'];
const NAMES   = ['Quick Learner','Sharp Mind','Night Owl','Star Student','Silent Reader',
                 'Fast Thinker','Deep Reader','Bold Achiever','Bright Spark','Wise Owl'];

function getMe() {
    let d = localStorage.getItem('dn_me');
    if (!d) {
        d = JSON.stringify({
            a: ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
            n: NAMES[Math.floor(Math.random() * NAMES.length)]
        });
        localStorage.setItem('dn_me', d);
    }
    return JSON.parse(d);
}
const ME = getMe();

/* ══════════════
   STATE
══════════════ */
const state = {
    activeTab:    'HOME',
    loaded:       new Set(),
    posts:        {}
};

/* ══════════════
   INIT
══════════════ */
document.addEventListener('DOMContentLoaded', () => {
    loadTab('HOME');
    loadSettings();
});

/* ══════════════
   SETTINGS
══════════════ */
async function loadSettings() {
    const s = await fetchSettings();
    if (s.telegram)  document.querySelectorAll('.soc-tg-link').forEach(el => el.href = s.telegram);
    if (s.whatsapp)  document.querySelectorAll('.soc-wa-link').forEach(el => el.href = s.whatsapp);
    if (s.instagram) document.querySelectorAll('.soc-ig-link').forEach(el => el.href = s.instagram);
    if (s.upi_id)    document.querySelectorAll('.upi-id').forEach(el => el.textContent = s.upi_id);
    if (s.upi_qr)    document.querySelectorAll('.qr-img').forEach(el => el.src = s.upi_qr);
    if (s.don_msg)   document.querySelectorAll('.don-text').forEach(el => el.textContent = s.don_msg);
}

/* ══════════════
   TAB SWITCH
══════════════ */
function st(id, el) {
    document.querySelectorAll('.tabp').forEach(p => p.classList.remove('on'));
    document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'));
    document.getElementById('t-' + id).classList.add('on');
    el.classList.add('on');
    state.activeTab = id;
    window.scrollTo(0, 0);
    if (!state.loaded.has(id)) loadTab(id);
}

/* ══════════════
   LOAD TAB
══════════════ */
async function loadTab(tab, filter = 'ALL') {
    const container = document.getElementById('c-' + tab);
    if (!container) return;

    container.innerHTML = buildSkeleton();

    const posts = await fetchPosts(tab, filter);
    state.posts[tab] = posts;
    state.loaded.add(tab);

    renderCards(tab, posts);
}

function buildSkeleton() {
    return Array(3).fill(0).map(() => `
    <div class="pcard" style="pointer-events:none">
        <div class="ca ca0" style="background:rgba(255,255,255,.08)"></div>
        <div class="ci">
            <div style="display:flex;gap:6px;margin-bottom:10px">
                <div class="skel" style="width:60px;height:20px;border-radius:10px"></div>
                <div class="skel" style="width:70px;height:20px;border-radius:10px"></div>
            </div>
            <div class="skel" style="width:90%;height:16px;border-radius:6px;margin-bottom:6px"></div>
            <div class="skel" style="width:100%;height:60px;border-radius:8px;margin-bottom:10px"></div>
            <div style="display:flex;gap:5px">
                <div class="skel" style="flex:1;height:36px;border-radius:11px"></div>
                <div class="skel" style="flex:1;height:36px;border-radius:11px"></div>
                <div class="skel" style="flex:1;height:36px;border-radius:11px"></div>
            </div>
        </div>
    </div>`).join('');
}

/* ══════════════
   RENDER CARDS
══════════════ */
function renderCards(tab, posts) {
    const el = document.getElementById('c-' + tab);
    if (!el) return;

    if (!posts.length) {
        el.innerHTML = `<div class="empty-state"><i class="bi bi-search"></i><p>Koi post nahi mili</p></div>`;
        return;
    }

    let html = '';
    posts.forEach((p, i) => {
        html += buildCard(p);
        if (i === 1) html += `<div class="ad-slot adsense-slot" style="margin:0 14px 14px"><!-- $adsense --></div>`;
        if (i === 3) html += `<div class="ad-slot affiliation-slot" style="margin:0 14px 14px"><!-- $affiliation --></div>`;
    });
    el.innerHTML = html;
}

/* ══════════════
   BUILD CARD
══════════════ */
function buildCard(p) {
    const slug    = p.slug || p.id;
    const liked   = isPostLiked(slug);
    const typeMap = { result:'lb-r', answerkey:'lb-u', admitcard:'lb-u', library:'lb-l' };
    const lbClass = typeMap[p.type] || 'lb-e';
    const acArr   = ['ca0','ca1','ca2','ca3'];
    const ac      = p.ac || acArr[slug.length % 4];
    const postUrl = `post.html?id=${slug}`;

    // Last date / Posted date from new structure
    const ld = p.dates?.apply_end || p.dates?.exam_date || p.ld || '—';
    const pd = p.pd || (p.created_at?.toDate ? p.created_at.toDate().toLocaleDateString('en-IN') : '—');

    return `
    <div class="pcard">
        <div class="ca ${ac}"></div>
        <div class="ci">
            <div class="c-top">
                <div class="c-labs">
                    <span class="lb ${lbClass}">${p.el || ''}</span>
                    <span class="lb lb-q">${p.ql || ''}</span>
                    ${p.type === 'sponsored' ? '<span class="lb" style="color:var(--pink);background:rgba(255,60,172,.1);border:1px solid rgba(255,60,172,.25)">Sponsored</span>' : ''}
                </div>
                <button class="ws-btn" onclick="shareWA('${slug}')"><i class="bi bi-whatsapp"></i></button>
            </div>
            <a href="${postUrl}" style="text-decoration:none;display:block">
                <div class="c-title">${p.title}</div>
                <div class="c-desc">${p.desc || ''}</div>
            </a>
            <div class="c-dates">
                <div class="cd-i cd-l"><i class="bi bi-calendar-x"></i> ${ld}</div>
                <span class="cd-sep">|</span>
                <div class="cd-i cd-p"><i class="bi bi-clock"></i> ${pd}</div>
            </div>
            <div class="c-bot">
                <button class="stb stb-l ${liked ? 'liked' : ''}" onclick="tLike(this,'${slug}',${p.likes||0})">
                    <i class="bi bi-heart-fill si"></i>
                    <span class="lc-${slug}">${formatNum(p.likes||0)}</span>
                </button>
                <a href="${postUrl}#comments" class="stb stb-c" style="text-decoration:none">
                    <i class="bi bi-chat-fill si"></i>
                    <span>${p.cmts || 0}</span>
                </a>
                <div class="stb stb-v">
                    <i class="bi bi-eye-fill si"></i>
                    <span>${formatNum(p.views||0)}</span>
                </div>
            </div>
        </div>
    </div>`;
}

/* ══════════════
   FILTER
══════════════ */
function fc(tab, label, btn) {
    document.querySelectorAll(`#lf-${tab} .lfb`).forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    state.loaded.delete(tab);
    loadTab(tab, label);
}

/* ══════════════
   LIKE
══════════════ */
async function tLike(btn, slug, currentLikes) {
    const result = await toggleLike(slug, currentLikes);
    if (result.liked) {
        btn.classList.add('liked');
        btn.style.transform = 'scale(1.3)';
        setTimeout(() => btn.style.transform = '', 200);
        toast('❤️ Post liked!');
    } else {
        btn.classList.remove('liked');
    }
    document.querySelectorAll(`.lc-${slug}`).forEach(e => e.textContent = formatNum(result.likes));
}

/* ══════════════
   SHARE
══════════════ */
function shareWA(slug) {
    const posts = state.posts[state.activeTab] || [];
    const p     = posts.find(x => (x.slug || x.id) === slug);
    const title = p ? p.title : 'DigiNotes';
    const base  = location.href.replace(/[^/]*$/, '');
    const url   = `${base}post.html?id=${slug}`;
    window.open('https://wa.me/?text=' + encodeURIComponent(`📚 ${title}\n\n${url}`), '_blank');
}

/* ══════════════
   PROFILE PAGE
══════════════ */
function openPP() {
    document.getElementById('ppg').classList.add('on');
    document.body.style.overflow = 'hidden';
    animateStats();
}
function closePP() {
    document.getElementById('ppg').classList.remove('on');
    document.body.style.overflow = '';
}
function ppTab(id, btn) {
    document.querySelectorAll('.pp-tab').forEach(b => b.classList.remove('on'));
    document.querySelectorAll('.pp-sec').forEach(s => s.classList.remove('on'));
    btn.classList.add('on');
    document.getElementById('pp-' + id).classList.add('on');
}

async function animateStats() {
    const s = await fetchSettings();
    const targets = [
        { id:'sv1', val: s.total_views  || 0 },
        { id:'sv2', val: s.month_views  || 0 },
        { id:'sv3', val: s.total_posts  || 0 },
        { id:'sv4', val: s.daily_visits || 0 },
    ];
    targets.forEach(({ id, val }) => {
        const el = document.getElementById(id);
        if (!el) return;
        let cur = 0;
        const step = Math.max(1, Math.ceil(val / 50));
        const iv = setInterval(() => {
            cur = Math.min(cur + step, val);
            el.textContent = cur >= 1000 ? (cur/1000).toFixed(1)+'K' : cur;
            if (cur >= val) clearInterval(iv);
        }, 30);
    });
}

/* ══════════════
   TOOLS PAGE
══════════════ */
function openTools() {
    document.getElementById('toolsPg').classList.add('on');
    document.body.style.overflow = 'hidden';
}
function closeTools() {
    document.getElementById('toolsPg').classList.remove('on');
    document.body.style.overflow = '';
}

/* ══════════════
   TOAST
══════════════ */
function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

/* ══════════════
   GLOBAL EXPOSE
══════════════ */
Object.assign(window, { st, fc, tLike, shareWA, openPP, closePP, ppTab, openTools, closeTools });
