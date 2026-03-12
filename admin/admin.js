/* ═══════════════════════════════════════════════
   DIGINOTES — ADMIN PANEL JAVASCRIPT
   Firebase Auth + Firestore + Storage
═══════════════════════════════════════════════ */

import {
    db, auth, storage,
    createPost, updatePost, deletePost,
    fetchSettings, saveSettings,
    uploadImage,
    adminLogin, adminLogout, onAuthStateChanged,
    makeSlug, formatNum, timeAgo,
    collection, query, orderBy, limit, serverTimestamp
} from 'https://masd.neocities.org/main/firebase-config.js';

import {
    getDocs, getDoc, setDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* ══════════════
   AUTH GUARD
══════════════ */
onAuthStateChanged(auth, user => {
    if (user) {
        showAdminApp();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminApp').style.display = 'none';
    }
});

function showAdminApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display = 'grid';
    initDashboard();
    loadAllPosts();
    loadFlaggedComments();
    loadMonetizationSettings();
    loadSiteSettings();
    startCommentsInterval();
}

/* ══════════════
   LOGIN / LOGOUT
══════════════ */
window.doLogin = async () => {
    const email = document.getElementById('loginUser').value.trim();
    const pass  = document.getElementById('loginPass').value;
    const err   = document.getElementById('loginErr');
    if (!email || !pass) { err.textContent = '⚠️ Email aur password zaroori hai'; return; }
    err.textContent = '⏳ Logging in...';
    const result = await adminLogin(email, pass);
    if (result.error) {
        err.textContent = '❌ Wrong email or password';
        document.getElementById('loginPass').value = '';
        setTimeout(() => err.textContent = '', 3000);
    }
};

window.doLogout = async () => { await adminLogout(); };

/* ══════════════
   NAVIGATION
══════════════ */
window.showPage = (id, navEl) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
    document.querySelectorAll('.sb-item').forEach(n => n.classList.remove('on'));
    document.getElementById('page-' + id)?.classList.add('on');
    if (navEl) navEl.classList.add('on');
    const titles = { dashboard:'Dashboard', newpost:'New Post', monetize:'Monetization', comments:'Comments', settings:'Settings' };
    document.getElementById('topbarTitle').textContent = titles[id] || id;
    if (window.innerWidth < 900) document.getElementById('sidebar').classList.remove('open');

    // Create Post button — hide on New Post page
    const btn = document.getElementById('createPostBtn');
    if (btn) btn.style.display = id === 'newpost' ? 'none' : 'flex';
};

window.goCreatePost = () => {
    showPage('newpost', document.querySelectorAll('.sb-item')[1]);
};

window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('open');

/* ══════════════
   DASHBOARD
══════════════ */
async function initDashboard() {
    renderBarChart();
    try {
        const snap = await getDoc(doc(db, 'settings', 'site'));
        const s = snap.exists() ? snap.data() : {};
        sv('d-visitors', formatNum(s.daily_visits || 0));
    } catch(e) {}
}

function sv(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

async function renderBarChart() {
    const el = document.getElementById('weeklyChart');
    if (!el) return;
    try {
        const snap = await getDoc(doc(db, 'analytics', 'weekly'));
        const data = snap.exists() ? snap.data() : {};
        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const values = days.map(d => data[d] || 0);
        const max = Math.max(...values) || 1;
        el.innerHTML = days.map((d, i) =>
            `<div class="bar-wrap"><div class="bar" style="height:${Math.round(values[i]/max*100)}%;background:${i===5?'var(--lime)':'var(--cyan)'};opacity:.8"></div><div class="bar-lbl">${d}</div></div>`
        ).join('');
    } catch(e) {
        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        el.innerHTML = days.map(d =>
            `<div class="bar-wrap"><div class="bar" style="height:4px;background:var(--cyan);opacity:.3"></div><div class="bar-lbl">${d}</div></div>`
        ).join('');
    }
}

/* ══════════════
   ALL POSTS
══════════════ */
let POSTS_CACHE = [];

async function loadAllPosts() {
    const el = document.getElementById('allPostsList');
    if (!el) return;
    el.innerHTML = `<div style="padding:20px;text-align:center;font-size:12px;color:rgba(255,255,255,.4)">⏳ Loading...</div>`;
    try {
        const q    = query(collection(db, 'posts'), orderBy('created_at', 'desc'), limit(100));
        const snap = await getDocs(q);
        POSTS_CACHE = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Real stats from posts
        const totalViews = POSTS_CACHE.reduce((a, p) => a + (p.views || 0), 0);
        const totalLikes = POSTS_CACHE.reduce((a, p) => a + (p.likes || 0), 0);
        sv('d-views', formatNum(totalViews));
        sv('d-likes', formatNum(totalLikes));
        sv('d-posts', POSTS_CACHE.length);

        applyFilters();
        renderDonut(POSTS_CACHE);
    } catch(e) {
        el.innerHTML = `<div style="padding:20px;text-align:center;font-size:12px;color:var(--pink)">⚠️ ${e.message}</div>`;
    }
}

const TYPE_ICON = {exam:'📋',result:'🏆',answerkey:'🔑',admitcard:'🪪',library:'📚',sponsored:'📢'};

window.applyFilters = () => {
    const type = document.getElementById('typeFilter')?.value || 'ALL';
    const sort = document.getElementById('sortFilter')?.value || 'latest';
    let posts = type === 'ALL' ? [...POSTS_CACHE] : POSTS_CACHE.filter(p => p.type === type);
    if (sort === 'oldest') posts = [...posts].reverse();
    else if (sort === 'views') posts = [...posts].sort((a,b) => (b.views||0)-(a.views||0));
    else if (sort === 'likes') posts = [...posts].sort((a,b) => (b.likes||0)-(a.likes||0));
    renderAllPosts(posts);
};

function renderAllPosts(posts) {
    const el = document.getElementById('allPostsList');
    if (!el) return;
    if (!posts.length) { el.innerHTML = `<div style="padding:20px;text-align:center;font-size:12px;color:rgba(255,255,255,.4)">Koi post nahi</div>`; return; }
    el.innerHTML = posts.map(p => `
    <div class="posts-tbl-row">
        <div class="ptbl-type">${TYPE_ICON[p.type]||'📄'}</div>
        <div class="ptbl-info">
            <div class="ptbl-title">${p.title||'Untitled'}</div>
            <div class="ptbl-date">${p.pub_date||'—'}</div>
            <div class="ptbl-bottom">
                <div class="ptbl-stats">
                    <span class="ptbl-stat cyan"><i class="bi bi-eye-fill"></i> ${formatNum(p.views||0)}</span>
                    <span class="ptbl-stat pink"><i class="bi bi-heart-fill"></i> ${formatNum(p.likes||0)}</span>
                </div>
                <div class="ptbl-actions">
                    <button class="icon-btn edit" onclick="editPost('${p.id}')"><i class="bi bi-pencil-fill"></i></button>
                    <button class="icon-btn del" onclick="confirmDelete('${p.id}','${(p.title||'').replace(/'/g,'')}',this)"><i class="bi bi-trash-fill"></i></button>
                </div>
            </div>
        </div>
    </div>`).join('');
}

function renderDonut(posts) {
    const el = document.getElementById('donutChart');
    if (!el) return;
    el.innerHTML = '';
    const c = {exam:0,result:0,library:0,updates:0};
    posts.forEach(p => {
        if (p.type === 'exam') c.exam++;
        else if (p.type === 'result') c.result++;
        else if (p.type === 'library') c.library++;
        else c.updates++;
    });
    const total = posts.length || 1;
    [{name:'Exam/Job',val:c.exam,color:'var(--orange)'},{name:'Result',val:c.result,color:'var(--lime)'},{name:'Library',val:c.library,color:'var(--purple)'},{name:'Updates',val:c.updates,color:'var(--cyan)'}]
    .forEach(i => {
        el.innerHTML += `<div class="donut-item"><div class="d-dot" style="background:${i.color}"></div><div class="d-lbl">${i.name}</div><div class="d-bar-track"><div class="d-bar-fill" style="width:${Math.round(i.val/total*100)}%;background:${i.color}"></div></div><div class="d-val">${i.val}</div></div>`;
    });
}

window.confirmDelete = async (id, title, btn) => {
    if (!confirm(`"${title}" delete karna chahte hain?`)) return;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    btn.disabled = true;
    const ok = await deletePost(id);
    if (ok) {
        POSTS_CACHE = POSTS_CACHE.filter(p => p.id !== id);
        applyFilters();
        renderDonut(POSTS_CACHE);
        sv('d-posts', POSTS_CACHE.length);
        toast('🗑️ Post deleted!');
    } else {
        toast('❌ Delete failed!');
        btn.innerHTML = '<i class="bi bi-trash-fill"></i>';
        btn.disabled = false;
    }
};

window.editPost = async (id) => {
    const post = POSTS_CACHE.find(p => p.id === id);
    if (!post) { toast('❌ Post nahi mili'); return; }
    showPage('newpost', document.querySelectorAll('.sb-item')[1]);
    selectType(post.type, null, true);
    setTimeout(() => {
        setF('f-title',    post.title);
        setF('f-org',      post.org);
        setF('f-advt',     post.advt_no);
        setF('f-desc',     post.desc || post.short_notice);
        setF('f-pd',       post.pub_date);
        setF('f-el',       post.el);
        setF('f-ql',       post.ql);
        setF('f-notice',   post.short_notice);
        setF('f-total',    post.seats?.total);
        setF('f-qual',     post.qualification_text);
        setF('f-age',      post.age_text);
        setF('f-postwise', post.postwise_text);
        setF('f-fee',      post.fee_text);
        setF('f-pmethods', post.fees?.methods?.join(', '));
        setF('f-pdf-url',  post.pdf_url);
        setF('f-thumb-url',post.thumbnail);
        setF('f-tags',     post.tags?.join(', '));
        if (post.dates) Object.entries(post.dates).forEach(([k,v]) => { const i = document.getElementById('tl-'+k); if(i) i.value = v; });
        if (post.links) Object.entries(post.links).forEach(([k,v]) => { const i = document.getElementById('f-l-'+k); if(i) i.value = v; });
        window._editSlug = id;
        document.getElementById('formTitle').textContent = `✏️ Editing: ${post.title?.slice(0,25)}...`;
        toast('✏️ Post loaded for editing!');
    }, 300);
};

function setF(id, val) { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; }

/* ══════════════
   NEW POST FORM
══════════════ */
let selectedType = null;

window.selectType = (type, el, fromEdit = false) => {
    selectedType = type;
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('on'));
    if (el) el.classList.add('on');
    else document.querySelectorAll('.type-card').forEach(c => { if (c.getAttribute('onclick')?.includes(`'${type}'`)) c.classList.add('on'); });
    document.getElementById('step2').style.display = 'block';
    const isSingle = (type === 'library' || type === 'sponsored');
    document.getElementById('cardForm').innerHTML  = isSingle ? buildSingleForm(type) : buildCardForm();
    document.getElementById('fullForm').innerHTML  = isSingle ? '' : buildFullForm(type);
    document.getElementById('fullFormWrap').style.display = isSingle ? 'none' : 'block';
    if (isSingle) document.getElementById('formTitle').textContent = 'Step 2 — Details';
    if (!fromEdit) {
        window._editSlug = null;
        document.getElementById('step2').scrollIntoView({ behavior:'smooth', block:'start' });
    }
};

/* ── Step 2 Card Form (type-aware) ── */
function buildCardForm() {
    const today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});

    // Library: sirf title + date
    if (selectedType === 'library') return `
    <div class="form-row">
        <div class="form-g"><label>File Title *</label><input type="text" id="f-title" placeholder="e.g. SSC CGL GS Notes 2026"></div>
        <div class="form-g"><label>Published Date</label><input type="text" id="f-pd" value="${today}" placeholder="20 Feb 2026"></div>
    </div>`;

    // Sponsored: sirf headline + date
    if (selectedType === 'sponsored') return `
    <div class="form-row">
        <div class="form-g"><label>Ad Headline *</label><input type="text" id="f-title" placeholder="e.g. Adda247 — 50% Off Courses!"></div>
        <div class="form-g"><label>Published Date</label><input type="text" id="f-pd" value="${today}" placeholder="20 Feb 2026"></div>
    </div>
    <div class="form-g"><label>Short Description (Feed card mein dikhegi)</label><textarea id="f-desc" style="height:60px" placeholder="1-2 line ad copy..."></textarea></div>`;

    // Exam/Result/AnswerKey/AdmitCard: full card form
    return `
    <div class="form-row">
        <div class="form-g"><label>Post Title *</label><input type="text" id="f-title" placeholder="e.g. RRB Group D Recruitment 2026"></div>
        <div class="form-g"><label>Organization</label><input type="text" id="f-org" placeholder="e.g. RRB, SSC, UPSC"></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Advertisement Number</label><input type="text" id="f-advt" placeholder="e.g. CEN 09/2025"></div>
        <div class="form-g"><label>Published Date</label><input type="text" id="f-pd" value="${today}" placeholder="20 Feb 2026"></div>
    </div>
    <div class="form-g"><label>Short Description (Feed card mein dikhegi)</label><textarea id="f-desc" style="height:70px" placeholder="3–4 lines jo feed card mein dikhe..."></textarea></div>
    <div class="form-row">
        <div class="form-g"><label>Exam Label</label><select id="f-el"><option>SSC</option><option>UPSC</option><option>Railway</option><option>Bank</option><option>Teaching</option><option>Police</option><option>State</option><option>Defence</option><option>Other</option></select></div>
        <div class="form-g"><label>Qualification Label</label><select id="f-ql"><option>10th</option><option>12th</option><option>ITI</option><option>Diploma</option><option>Graduate</option><option>Post Graduate</option><option>Any</option></select></div>
    </div>`;
}

/* ── Single Step Forms (Library & Sponsored) ── */
function buildSingleForm(type) {
    const today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
    if (type === 'library') return `
    <div class="form-g">
        <label>📁 PDF Upload</label>
        <div class="upload-box" id="pdfUploadBox" onclick="document.getElementById('f-pdf-file').click()">
            <i class="bi bi-cloud-upload-fill" style="font-size:2rem;color:var(--muted)"></i>
            <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:6px">PDF yahan click karke upload karein</div>
            <div style="font-size:10px;color:rgba(255,255,255,.25);margin-top:3px">Max 50MB · PDF only</div>
        </div>
        <input type="file" id="f-pdf-file" accept=".pdf" style="display:none" onchange="handlePdfUpload(this)">
        <div id="pdf-upload-status" style="display:none;margin-top:8px;font-size:11px;"></div>
        <input type="hidden" id="f-pdf-url">
    </div>
    <div class="form-row">
        <div class="form-g"><label>File Title *</label><input type="text" id="f-title" placeholder="e.g. SSC CGL GS Notes 2026"></div>
        <div class="form-g"><label>File Size</label><input type="text" id="f-fsize" placeholder="Auto-fetch hoga" readonly></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Upload Date</label><input type="text" id="f-pd" value="${today}" readonly></div>
        <div class="form-g"><label>Subject</label><select id="f-subject"><option>GS</option><option>Maths</option><option>Reasoning</option><option>English</option><option>Hindi</option><option>Science</option><option>History</option><option>Polity</option><option>Geography</option><option>Economy</option></select></div>
    </div>
    <div class="form-g"><label>Short Description</label><textarea id="f-desc" style="height:60px" placeholder="PDF ke baare mein..."></textarea></div>
    <div class="form-g">
        <label>🖼️ Thumbnail</label>
        <div style="display:flex;gap:8px;align-items:center">
            <div class="upload-box thumb-upload" onclick="document.getElementById('f-thumb-file').click()">
                <i class="bi bi-image" style="font-size:1.5rem;color:var(--muted)"></i>
                <div style="font-size:10px;color:var(--muted);margin-top:4px">Upload</div>
            </div>
            <input type="file" id="f-thumb-file" accept="image/*" style="display:none" onchange="handleThumbUpload(this)">
            <div style="flex:1"><input type="url" id="f-thumb-url" placeholder="Ya image URL yahan paste karein" style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:9px 12px;color:#fff;font-family:'Poppins',sans-serif;font-size:12px;outline:none"></div>
        </div>
    </div>
    <div class="form-g"><label>Tags (comma se)</label><input type="text" id="f-tags" placeholder="SSC, CGL, GS, History, UPSC"></div>`;

    if (type === 'sponsored') return `
    <div class="form-row">
        <div class="form-g"><label>Firm / Agency Name *</label><input type="text" id="f-title" placeholder="e.g. Adda247 Coaching"></div>
        <div class="form-g"><label>Category</label><select id="f-sp-cat"><option>Coaching</option><option>Book Store</option><option>App</option><option>Education Platform</option><option>Other</option></select></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Contact (apne record ke liye)</label><input type="text" id="f-sp-contact" placeholder="Email / Phone"></div>
        <div class="form-g"><label>CTA Button Text</label><input type="text" id="f-cta" placeholder="Join Now / Apply Now / Visit"></div>
    </div>
    <div class="form-g"><label>Headline (card mein bold dikhega)</label><input type="text" id="f-desc" placeholder="e.g. India's #1 SSC Coaching — 50% Off!"></div>
    <div class="form-g"><label>Description</label><textarea id="f-notice" style="height:70px" placeholder="Ad content..."></textarea></div>
    <div class="form-row">
        <div class="form-g"><label>Landing Page URL *</label><input type="url" id="f-l-apply" placeholder="https://..."></div>
        <div class="form-g"><label>Banner Image URL</label><input type="url" id="f-banner" placeholder="https://...image.jpg"></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Ad Start Date</label><input type="date" id="f-sp-start"></div>
        <div class="form-g"><label>Ad End Date</label><input type="date" id="f-sp-end"></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
        <label class="toggle-sw"><input type="checkbox" id="f-sp-active" checked><span class="tog-slider"></span></label>
        <span style="font-size:12px;font-weight:700;color:var(--text)">Ad Active hai</span>
    </div>`;
    return '';
}

/* ── Date row helper ── */
function dRow(key, label, def='') {
    return `<div class="date-row">
        <span class="date-lbl">${label}</span>
        <input type="text" id="tl-${key}" value="${def}" placeholder="DD Mon YYYY  /  TBA  /  blank=hidden" class="date-inp">
    </div>`;
}

/* ── Link row helper ── */
function lRow(key, label) {
    return `<div class="form-g"><label>${label}</label><input type="url" id="f-l-${key}" placeholder="https://...  (TBA likhein ya blank chhodein)"></div>`;
}

/* ── Important Dates block ── */
const DATES_HTML = `
<div class="form-g" style="margin-top:12px">
    <label>📅 Important Dates</label>
    <div class="dates-builder">
        ${dRow('notif_date',      '📢 Notification Date')}
        ${dRow('apply_start',     '📝 Apply Start')}
        ${dRow('apply_end',       '📅 Last Date Apply')}
        ${dRow('fee_payment_start','💳 Fee Payment Start')}
        ${dRow('fee_payment_end', '💳 Fee Payment End')}
        ${dRow('correction_start','✏️ Correction Start')}
        ${dRow('correction_end',  '✏️ Correction End')}
        ${dRow('admit_card',      '🪪 Admit Card')}
        <div class="date-row">
            <span class="date-lbl">📋 Exam Date (Range)</span>
            <div style="display:flex;gap:6px;flex:1">
                <input type="text" id="tl-exam_date_start" placeholder="Start / TBA" class="date-inp" style="flex:1">
                <span style="color:var(--muted);align-self:center;font-size:12px;font-weight:800">~</span>
                <input type="text" id="tl-exam_date_end" placeholder="End (optional)" class="date-inp" style="flex:1">
            </div>
        </div>
        ${dRow('answer_key',    '🔑 Answer Key Release')}
        ${dRow('objection_start','⚠️ Objection Start')}
        ${dRow('objection_end',  '⚠️ Objection End')}
        ${dRow('result',         '🏆 Result Date')}
        ${dRow('scrutiny',       '📂 Scrutiny/DV')}
        ${dRow('medical',        '🏥 Medical Test')}
        ${dRow('merit_list',     '📊 Merit List')}
        ${dRow('joining',        '🎯 Joining Date')}
    </div>
    <div class="dates-hint">💡 Blank chhodein = field nahi dikhega &nbsp;|&nbsp; TBA = yellow TBA badge</div>
</div>`;

/* ── Important Links block ── */
const LINKS_HTML = `
<div class="links-heading">🔗 Important Links (blank = hidden, TBA likh sakte ho)</div>
<div class="form-row">
    ${lRow('official_site', '🌐 Official Website')}
    ${lRow('apply',         '📝 Apply Online')}
</div>
<div class="form-row">
    ${lRow('notification',     '📄 Official Notification PDF')}
    ${lRow('revised_vacancy',  '📋 Revised Vacancy')}
</div>
<div class="form-row">
    ${lRow('admit_card',  '🪪 Admit Card Link')}
    ${lRow('answer_key',  '🔑 Answer Key Link')}
</div>
<div class="form-row">
    ${lRow('result',     '🏆 Result Link')}
    ${lRow('merit_list', '📊 Merit List Link')}
</div>`;

/* ── Step 3: Exam Full Form ── */
function buildExamFullForm() {
    return `
    <div class="form-g"><label>Short Notice (Hero section)</label><textarea id="f-notice" style="height:60px" placeholder="1-2 line brief..."></textarea></div>
    <div class="form-g"><label>Total Posts *</label><input type="number" id="f-total" placeholder="e.g. 22195"></div>

    <div class="form-g" style="margin-top:10px">
        <label>📋 Qualification <span class="hint-lbl">(ek line = ek point)</span></label>
        <textarea id="f-qual" style="height:100px" placeholder="Class 10 pass from recognized board&#10;ITI certificate required&#10;Age 18-36 years for General"></textarea>
    </div>

    <div class="form-g">
        <label>👤 Age Limit <span class="hint-lbl">(ek line = ek point)</span></label>
        <textarea id="f-age" style="height:80px" placeholder="General: 18-36 years&#10;OBC: 18-39 years&#10;SC/ST: 18-41 years&#10;Cutoff date: 01 Jan 2026"></textarea>
    </div>

    <div class="form-g">
        <label>💼 Post-wise Vacancy <span class="hint-lbl">(ek line = ek post)</span></label>
        <textarea id="f-postwise" style="height:100px" placeholder="Track Maintainer Gr. IV — 11032&#10;Pointsman-B — 5053&#10;Assistant (S&T) — 1509"></textarea>
    </div>

    <div class="form-g">
        <label>📊 Reservation</label>
        <div class="static-notice">ℹ️ Category-wise reservation ke liye official notification dekhein.</div>
    </div>

    <div class="form-g" style="margin-top:10px">
        <label>💰 Application Fee <span class="hint-lbl">(ek line = ek category)</span></label>
        <textarea id="f-fee" style="height:80px" placeholder="General/OBC/EWS | ₹500&#10;SC/ST/PH | ₹250&#10;Female (All) | ₹250"></textarea>
    </div>
    <div class="form-g">
        <label>Payment Methods <span class="hint-lbl">(comma se)</span></label>
        <input type="text" id="f-pmethods" value="Debit Card, Credit Card, Internet Banking, IMPS, UPI, Mobile Wallet">
    </div>

    ${DATES_HTML}
    ${LINKS_HTML}`;
}

/* ── Step 3: Result / Answer Key / Admit Card (Auto-fetch) ── */
function buildAutoFetchForm(type) {
    const labels = { result:'Result', answerkey:'Answer Key', admitcard:'Admit Card' };
    const specificLinks = {
        result:     `<div class="form-row">${lRow('result','🏆 Result Link')}</div>`,
        answerkey:  `<div class="form-row">${lRow('answer_key','🔑 Answer Key PDF')}${lRow('objection_portal','⚠️ Objection Portal')}</div>`,
        admitcard:  `<div class="form-row">${lRow('admit_card','🪪 Admit Card Link')}</div>`,
    };
    return `
    <div class="form-g">
        <label>🔍 Linked Exam Post se Auto-Fill</label>
        <input type="text" id="f-exam-search" placeholder="Exam ka title type karo..." oninput="searchExamPosts(this.value)" autocomplete="off">
        <div id="exam-suggestions" class="exam-suggestions" style="display:none"></div>
        <input type="hidden" id="f-linked-exam-id">
        <div id="linked-exam-preview" class="linked-exam-preview" style="display:none"></div>
    </div>
    <div class="form-g"><label>Short Notice</label><textarea id="f-notice" style="height:60px" placeholder="${labels[type]} ke baare mein..."></textarea></div>
    ${DATES_HTML}
    <div class="links-heading">🔗 ${labels[type]} Link</div>
    ${specificLinks[type]}`;
}

/* ── Step 3: Library ── */
function buildLibraryForm() {
    return `
    <div class="form-g">
        <label>📁 PDF Upload</label>
        <div class="upload-box" id="pdfUploadBox" onclick="document.getElementById('f-pdf-file').click()">
            <i class="bi bi-cloud-upload-fill" style="font-size:2rem;color:var(--muted)"></i>
            <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:6px">PDF yahan click karke upload karein</div>
            <div style="font-size:10px;color:rgba(255,255,255,.25);margin-top:3px">Max 50MB · PDF only</div>
        </div>
        <input type="file" id="f-pdf-file" accept=".pdf" style="display:none" onchange="handlePdfUpload(this)">
        <div id="pdf-upload-status" style="display:none;margin-top:8px;font-size:11px;"></div>
        <input type="hidden" id="f-pdf-url">
    </div>
    <div class="form-row">
        <div class="form-g"><label>File Name / Title *</label><input type="text" id="f-title" placeholder="e.g. SSC CGL GS Notes 2026"></div>
        <div class="form-g"><label>File Size</label><input type="text" id="f-fsize" placeholder="Auto-fetch hoga" readonly></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Upload Date</label><input type="text" id="f-udate" value="${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}" readonly></div>
        <div class="form-g"><label>Subject</label><select id="f-subject"><option>GS</option><option>Maths</option><option>Reasoning</option><option>English</option><option>Hindi</option><option>Science</option><option>History</option><option>Polity</option><option>Geography</option><option>Economy</option></select></div>
    </div>
    <div class="form-g"><label>Short Description</label><textarea id="f-notice" style="height:60px" placeholder="PDF ke baare mein..."></textarea></div>
    <div class="form-g">
        <label>🖼️ Thumbnail</label>
        <div style="display:flex;gap:8px;align-items:center">
            <div class="upload-box thumb-upload" onclick="document.getElementById('f-thumb-file').click()">
                <i class="bi bi-image" style="font-size:1.5rem;color:var(--muted)"></i>
                <div style="font-size:10px;color:var(--muted);margin-top:4px">Upload</div>
            </div>
            <input type="file" id="f-thumb-file" accept="image/*" style="display:none" onchange="handleThumbUpload(this)">
            <div style="flex:1"><input type="url" id="f-thumb-url" placeholder="Ya image URL yahan paste karein" style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:9px 12px;color:#fff;font-family:'Poppins',sans-serif;font-size:12px;outline:none;transition:border-color .2s" onfocus="this.style.borderColor='var(--orange)'" onblur="this.style.borderColor='rgba(255,255,255,.1)'"></div>
        </div>
    </div>
    <div class="form-g"><label>Tags <span class="hint-lbl">(comma se)</span></label><input type="text" id="f-tags" placeholder="SSC, CGL, GS, History, UPSC"></div>`;
}

/* ── Step 3: Sponsored ── */
function buildSponsoredForm() {
    return `
    <div class="form-row">
        <div class="form-g"><label>Firm / Agency Name *</label><input type="text" id="f-title" placeholder="e.g. Adda247 Coaching"></div>
        <div class="form-g"><label>Category</label><select id="f-sp-cat"><option>Coaching</option><option>Book Store</option><option>App</option><option>Education Platform</option><option>Other</option></select></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Contact <span class="hint-lbl">(apne record ke liye)</span></label><input type="text" id="f-sp-contact" placeholder="Email / Phone"></div>
        <div class="form-g"><label>CTA Button Text</label><input type="text" id="f-cta" placeholder="Join Now / Apply Now / Visit"></div>
    </div>
    <div class="form-g"><label>Headline (card mein bold dikhega)</label><input type="text" id="f-desc" placeholder="e.g. India's #1 SSC Coaching — 50% Off!"></div>
    <div class="form-g"><label>Description</label><textarea id="f-notice" style="height:70px" placeholder="Ad content..."></textarea></div>
    <div class="form-row">
        <div class="form-g"><label>Landing Page URL *</label><input type="url" id="f-l-apply" placeholder="https://..."></div>
        <div class="form-g"><label>Banner Image URL</label><input type="url" id="f-banner" placeholder="https://...image.jpg"></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Ad Start Date</label><input type="date" id="f-sp-start"></div>
        <div class="form-g"><label>Ad End Date</label><input type="date" id="f-sp-end"></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
        <label class="toggle-sw"><input type="checkbox" id="f-sp-active" checked><span class="tog-slider"></span></label>
        <span style="font-size:12px;font-weight:700;color:var(--text)">Ad Active hai</span>
    </div>`;
}

function buildFullForm(type) {
    if (type === 'exam')                             return buildExamFullForm();
    if (type === 'result' || type === 'answerkey' || type === 'admitcard') return buildAutoFetchForm(type);
    if (type === 'library')                          return buildLibraryForm();
    if (type === 'sponsored')                        return buildSponsoredForm();
    return '';
}

/* ══════════════
   EXAM SEARCH (Result/AnswerKey/AdmitCard)
══════════════ */
window.searchExamPosts = (q) => {
    const el = document.getElementById('exam-suggestions');
    if (!el) return;
    if (!q || q.length < 2) { el.style.display = 'none'; return; }
    const matches = POSTS_CACHE.filter(p =>
        p.type === 'exam' && p.title?.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 6);
    if (!matches.length) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.innerHTML = matches.map(p =>
        `<div class="exam-sug-item" onclick="selectLinkedExam('${p.id}','${(p.title||'').replace(/'/g,"\\'")}')">
            <span>📋</span>
            <div>
                <div style="font-size:11px;font-weight:700;color:#fff">${p.title}</div>
                <div style="font-size:9px;color:var(--muted)">${p.el||''} · ${p.pub_date||''}</div>
            </div>
        </div>`
    ).join('');
};

window.selectLinkedExam = (id, title) => {
    document.getElementById('f-linked-exam-id').value = id;
    document.getElementById('f-exam-search').value = title;
    document.getElementById('exam-suggestions').style.display = 'none';
    const post = POSTS_CACHE.find(p => p.id === id);
    const preview = document.getElementById('linked-exam-preview');
    if (post && preview) {
        preview.style.display = 'block';
        preview.innerHTML = `✅ Linked: <strong>${post.title}</strong> — Dates auto-fill ho gayi!`;
        // Auto-fill dates from parent exam
        if (post.dates) {
            Object.entries(post.dates).forEach(([k, v]) => {
                const inp = document.getElementById('tl-' + k);
                if (inp) inp.value = v;
            });
        }
    }
};

/* ══════════════
   FILE UPLOADS
══════════════ */
window.handlePdfUpload = async (input) => {
    const file = input.files[0];
    if (!file) return;
    const status = document.getElementById('pdf-upload-status');
    const box    = document.getElementById('pdfUploadBox');
    const sizeMB = (file.size / (1024*1024)).toFixed(2);
    setF('f-fsize', `${sizeMB} MB`);
    status.style.display = 'block';
    status.innerHTML = `<span style="color:var(--teal)">⏳ Uploading ${file.name}... (${sizeMB} MB)</span>`;
    try {
        const result = await uploadImage(file, `library/${Date.now()}_${makeSlug(file.name)}`);
        if (result.error) throw new Error(result.error);
        document.getElementById('f-pdf-url').value = result.url;
        status.innerHTML = `<span style="color:var(--green)">✅ Upload ho gaya! (${sizeMB} MB)</span>`;
        box.innerHTML = `<i class="bi bi-file-pdf-fill" style="font-size:2rem;color:var(--green)"></i><div style="font-size:11px;font-weight:700;color:var(--green);margin-top:6px">${file.name}</div>`;
    } catch(e) {
        status.innerHTML = `<span style="color:var(--red)">❌ Upload failed: ${e.message}</span>`;
        console.error('PDF Upload error:', e);
    }
};

window.handleThumbUpload = async (input) => {
    const file = input.files[0];
    if (!file) return;
    try {
        const result = await uploadImage(file, `thumbnails/${Date.now()}`);
        if (result.error) throw new Error(result.error);
        setF('f-thumb-url', result.url);
        // Preview thumbnail
        const prev = document.getElementById('thumb-preview');
        if (prev) { prev.src = result.url; prev.style.display = 'block'; }
        toast('✅ Thumbnail uploaded!');
    } catch(e) {
        toast('❌ Thumbnail upload failed: ' + e.message);
        console.error('Thumb upload error:', e);
    }
};

/* ══════════════
   COLLECT DATA
══════════════ */
function g(id) { return document.getElementById(id)?.value?.trim() || ''; }

function collectData() {
    const dates = {};
    ['notif_date','apply_start','apply_end','fee_payment_start','fee_payment_end',
     'correction_start','correction_end','admit_card','answer_key',
     'objection_start','objection_end','result','scrutiny','medical','merit_list','joining']
    .forEach(k => { const v = g('tl-'+k); if (v) dates[k] = v; });

    // Exam date range
    const eds = g('tl-exam_date_start');
    const ede = g('tl-exam_date_end');
    if (eds) dates.exam_date = ede ? `${eds} ~ ${ede}` : eds;

    return {
        title:             g('f-title'),
        org:               g('f-org'),
        advt_no:           g('f-advt'),
        desc:              g('f-desc'),
        short_notice:      g('f-notice') || g('f-desc'),
        el:                g('f-el'),
        ql:                g('f-ql'),
        pub_date:          g('f-pd'),
        ac:                'ca0',
        type:              selectedType,
        tabs:              {exam:['HOME','EXAM'],result:['HOME','RESULT'],answerkey:['HOME','UPDATES'],admitcard:['HOME','UPDATES'],library:['HOME','LIBRARY'],sponsored:['HOME']}[selectedType] || ['HOME'],
        linked_exam_id:    g('f-linked-exam-id') || null,
        seats:             g('f-total') ? { total: parseInt(g('f-total')) } : null,
        qualification_text:g('f-qual')     || null,
        age_text:          g('f-age')      || null,
        postwise_text:     g('f-postwise') || null,
        fee_text:          g('f-fee')      || null,
        fees:              g('f-pmethods') ? { methods: g('f-pmethods').split(',').map(m=>m.trim()).filter(Boolean) } : null,
        pdf_url:           g('f-pdf-url')  || null,
        thumbnail:         g('f-thumb-url')|| null,
        subject:           g('f-subject')  || null,
        tags:              g('f-tags') ? g('f-tags').split(',').map(t=>t.trim()).filter(Boolean) : null,
        sponsor_category:  g('f-sp-cat')   || null,
        sponsor_contact:   g('f-sp-contact')|| null,
        cta_text:          g('f-cta')      || null,
        banner:            g('f-banner')   || null,
        ad_start:          g('f-sp-start') || null,
        ad_end:            g('f-sp-end')   || null,
        ad_active:         document.getElementById('f-sp-active')?.checked ?? true,
        dates,
        links: Object.fromEntries(
            [['official_site',g('f-l-official_site')],['apply',g('f-l-apply')],
             ['notification',g('f-l-notification')],['revised_vacancy',g('f-l-revised_vacancy')],
             ['admit_card',g('f-l-admit_card')],['answer_key',g('f-l-answer_key')],
             ['result',g('f-l-result')],['merit_list',g('f-l-merit_list')],
             ['objection',g('f-l-objection_portal')]].filter(([,v])=>v)
        ),
    };
}

/* ══════════════
   PREVIEW
══════════════ */
window.previewPost = () => {
    if (!selectedType) { toast('⚠️ Type select karo!'); return; }
    const d = collectData();
    if (!d.title) { toast('⚠️ Title zaroori hai!'); return; }
    const tc = {exam:'var(--orange)',result:'var(--lime)',answerkey:'var(--cyan)',admitcard:'var(--yellow)',library:'var(--purple)',sponsored:'var(--pink)'}[selectedType];
    document.getElementById('previewBody').innerHTML = `
    <p style="font-size:11px;color:rgba(255,255,255,.35);margin-bottom:10px">Feed card preview:</p>
    <div style="background:var(--bg);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden">
        <div style="height:3px;background:linear-gradient(90deg,var(--orange),var(--pink),var(--purple))"></div>
        <div style="padding:12px 13px">
            <div style="display:flex;gap:5px;margin-bottom:8px">
                <span style="font-size:8px;font-weight:900;padding:3px 9px;border-radius:20px;color:${tc};background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)">${d.el}</span>
                <span style="font-size:8px;font-weight:900;padding:3px 9px;border-radius:20px;color:var(--yellow);background:rgba(255,229,0,.08);border:1px solid rgba(255,229,0,.2)">${d.ql}</span>
            </div>
            <div style="font-size:.9rem;font-weight:800;color:#fff;margin-bottom:5px;line-height:1.35">${d.title}</div>
            <div style="font-size:.72rem;color:rgba(220,210,255,.55);line-height:1.55;margin-bottom:8px">${d.desc}</div>
            <div style="font-size:9px;font-weight:700;color:var(--orange);margin-bottom:8px">📅 ${d.dates?.apply_end||d.dates?.exam_date||'—'} | 🕐 ${d.pub_date}</div>
            <div style="display:flex;gap:5px">
                <div style="flex:1;text-align:center;padding:6px;border-radius:9px;background:rgba(255,60,172,.12);font-size:10px;font-weight:700;color:rgba(255,255,255,.7)">❤️ 0</div>
                <div style="flex:1;text-align:center;padding:6px;border-radius:9px;background:rgba(0,229,255,.1);font-size:10px;font-weight:700;color:rgba(255,255,255,.7)">💬 0</div>
                <div style="flex:1;text-align:center;padding:6px;border-radius:9px;background:rgba(191,95,255,.1);font-size:10px;font-weight:700;color:rgba(255,255,255,.7)">👁 0</div>
            </div>
        </div>
    </div>
    <div style="margin-top:10px;font-size:10px;color:rgba(0,229,255,.6)">🔗 URL: post.html?id=${makeSlug(d.title)}</div>`;
    document.getElementById('previewModal').classList.add('on');
};
window.closePreview = () => document.getElementById('previewModal').classList.remove('on');

/* ══════════════
   PUBLISH
══════════════ */
window.publishPost = async () => {
    if (!selectedType) { toast('⚠️ Type select karo!'); return; }
    const d = collectData();
    if (!d.title) { toast('⚠️ Title zaroori hai!'); return; }
    const btn = document.querySelector('.btn-publish');
    const orig = btn?.innerHTML;
    if (btn) { btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Publishing...'; btn.disabled = true; }
    try {
        let slug;
        if (window._editSlug) {
            await updatePost(window._editSlug, d);
            slug = window._editSlug;
            const idx = POSTS_CACHE.findIndex(p => p.id === slug);
            if (idx !== -1) POSTS_CACHE[idx] = { ...POSTS_CACHE[idx], ...d };
        } else {
            slug = await createPost(d);
            POSTS_CACHE.unshift({ id: slug, ...d, likes:0, views:0, cmts:0 });
        }
        window._editSlug = null;
        closePreview();
        document.getElementById('successModal').classList.add('on');
        document.getElementById('successSlug').textContent = `post.html?id=${slug}`;
        resetForm();
        applyFilters();
        renderDonut(POSTS_CACHE);
        sv('d-posts', POSTS_CACHE.length);
    } catch(e) {
        toast('❌ Error: ' + e.message);
    }
    if (btn) { btn.innerHTML = orig; btn.disabled = false; }
};

window.closeSuccess = () => {
    document.getElementById('successModal').classList.remove('on');
    showPage('dashboard', document.querySelectorAll('.sb-item')[0]);
};

window.resetForm = () => {
    selectedType = null; window._editSlug = null;
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('on'));
    document.getElementById('step2').style.display = 'none';
    document.getElementById('cardForm').innerHTML = '';
    document.getElementById('fullForm').innerHTML = '';
};

/* ══════════════
   COMMENTS
══════════════ */
async function loadFlaggedComments() {
    const el = document.getElementById('flaggedComments');
    if (!el) return;
    try {
        // Real stats
        const statsSnap = await getDoc(doc(db, 'comment_stats', 'summary'));
        if (statsSnap.exists()) {
            const s = statsSnap.data();
            sv('c-total',    formatNum(s.total    || 0));
            sv('c-approved', formatNum(s.approved || 0));
            sv('c-flagged',  formatNum(s.flagged  || 0));
            sv('c-pending',  formatNum(s.pending  || 0));
        }
        const q    = query(collection(db, 'flagged_comments'), orderBy('created_at','desc'), limit(20));
        const snap = await getDocs(q);
        if (snap.empty) { el.innerHTML = '<div class="empty-msg">✅ Koi flagged comment nahi hai</div>'; return; }
        el.innerHTML = snap.docs.map(d => {
            const c = d.data();
            return `<div class="cmt-mod-row" id="fc${d.id}">
                <div class="mod-av">${c.animal||'🦆'}</div>
                <div class="mod-info">
                    <div class="mod-name">${c.name||'Anonymous'} <span style="font-size:9px;color:var(--pink);background:rgba(255,60,172,.1);padding:2px 7px;border-radius:6px;margin-left:4px;font-weight:800">${c.reason||'Flagged'}</span></div>
                    <div class="mod-txt">${c.text||''}</div>
                    <div class="mod-meta">Post: ${c.post_slug||'—'} · ${timeAgo(c.created_at)}</div>
                </div>
                <div class="mod-actions">
                    <button class="mod-app" onclick="approveFlagged('${d.id}')">✓ Keep</button>
                    <button class="mod-del" onclick="deleteFlagged('${d.id}')">🗑 Delete</button>
                </div>
            </div>`;
        }).join('');
    } catch(e) { el.innerHTML = '<div class="empty-msg">⚠️ Comments load nahi hue</div>'; }
}

function startCommentsInterval() {
    // Refresh every 5 minutes — only when Comments page is open
    setInterval(() => {
        if (document.getElementById('page-comments')?.classList.contains('on')) {
            loadFlaggedComments();
        }
    }, 5 * 60 * 1000);
}

window.approveFlagged = (id) => { document.getElementById('fc'+id)?.remove(); toast('✅ Approved!'); };
window.deleteFlagged  = async (id) => {
    try { await deleteDoc(doc(db, 'flagged_comments', id)); } catch(e) {}
    document.getElementById('fc'+id)?.remove();
    toast('🗑️ Deleted!');
};
window.deleteAllFlagged = () => {
    document.getElementById('flaggedComments').innerHTML = '<div class="empty-msg">✅ All cleared!</div>';
    toast('🗑️ All flagged cleared!');
};

/* ══════════════
   MONETIZATION
══════════════ */
async function loadMonetizationSettings() {
    try {
        const s = await fetchSettings();
        if (s.adsense_script)   setF('sc-adsense',   s.adsense_script);
        if (s.affiliate_script) setF('sc-affiliate', s.affiliate_script);
        if (s.upi_id)  setF('upiId',  s.upi_id);
        if (s.upi_qr)  setF('upiQr',  s.upi_qr);
        if (s.don_msg) setF('donMsg', s.don_msg);
    } catch(e) {}
}

window.saveScript = async (type) => {
    const val = g('sc-' + type);
    if (!val) { toast('⚠️ Script empty!'); return; }
    const ok = await saveSettings({ [`${type}_script`]: val });
    toast(ok ? `✅ ${type} script saved!` : '❌ Failed!');
};
window.toggleAd = async (type, el) => {
    await saveSettings({ [`${type}_enabled`]: el.checked });
    toast(el.checked ? `✅ ${type} enabled!` : `⛔ ${type} disabled!`);
};

/* ══════════════
   SITE SETTINGS
══════════════ */
async function loadSiteSettings() {
    try {
        const s = await fetchSettings();
        setF('site-name',    s.site_name || 'DigiNotes.net');
        setF('site-tagline', s.tagline   || '');
        setF('site-tg',      s.telegram  || '');
        setF('site-wa',      s.whatsapp  || '');
        setF('site-ig',      s.instagram || '');
    } catch(e) {}
}

window.saveSiteSettings = async () => {
    const ok = await saveSettings({ site_name:g('site-name'), tagline:g('site-tagline'), telegram:g('site-tg'), whatsapp:g('site-wa'), instagram:g('site-ig') });
    toast(ok ? '✅ Site settings saved!' : '❌ Failed!');
};
window.saveFilterSettings = async () => {
    const ok = await saveSettings({ blocked_words: g('blockedWords') });
    toast(ok ? '✅ Filter saved!' : '❌ Failed!');
};
window.saveUPI = async () => {
    const ok = await saveSettings({ upi_id:g('upiId'), upi_qr:g('upiQr'), don_msg:g('donMsg') });
    toast(ok ? '✅ UPI saved!' : '❌ Failed!');
};

/* ══════════════
   TOAST
══════════════ */
function toast(msg) {
    const t = document.getElementById('atoast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}
window.toast = toast;

/* ══════════════
   SIDEBAR
══════════════ */
window.addEventListener('click', e => {
    const sb = document.getElementById('sidebar');
    if (window.innerWidth < 900 && sb?.classList.contains('open') && !sb.contains(e.target) && !e.target.closest('.menu-toggle'))
        sb.classList.remove('open');
    // Close exam suggestions
    if (!e.target.closest('#f-exam-search') && !e.target.closest('#exam-suggestions')) {
        const sug = document.getElementById('exam-suggestions');
        if (sug) sug.style.display = 'none';
    }
});
