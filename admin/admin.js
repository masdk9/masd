/* ═══════════════════════════════════════════════
   DIGINOTES — ADMIN PANEL JAVASCRIPT
   Firebase Auth + Firestore + Storage
═══════════════════════════════════════════════ */

import {
    db, auth, storage,
    createPost, updatePost, deletePost, fetchPostBySlug,
    fetchSettings, saveSettings,
    uploadImage,
    adminLogin, adminLogout, onAuthStateChanged,
    makeSlug, formatNum, timeAgo,
    collection, query, orderBy, limit, serverTimestamp
} from '../firebase-config.js';

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
    const titles = { dashboard:'Dashboard', newpost:'New Post', posts:'All Posts', monetize:'Monetization', comments:'Comments', settings:'Settings' };
    document.getElementById('topbarTitle').textContent = titles[id] || id;
    if (window.innerWidth < 900) document.getElementById('sidebar').classList.remove('open');
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
        const postsSnap = await getDocs(collection(db, 'posts'));
        sv('d-views',    formatNum(s.total_views  || 0));
        sv('d-posts',    postsSnap.size);
        sv('d-likes',    formatNum(s.total_likes  || 0));
        sv('d-visitors', formatNum(s.daily_visits || 0));
    } catch(e) {}
}

function sv(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function renderBarChart() {
    const data = [{day:'Mon',val:3200},{day:'Tue',val:4100},{day:'Wed',val:3800},{day:'Thu',val:5200},{day:'Fri',val:4800},{day:'Sat',val:6100},{day:'Sun',val:5400}];
    const max = Math.max(...data.map(d => d.val));
    const el = document.getElementById('weeklyChart');
    if (!el) return;
    el.innerHTML = data.map((d,i) => `<div class="bar-wrap"><div class="bar" style="height:${Math.round(d.val/max*100)}%;background:${i===5?'var(--lime)':'var(--cyan)'};opacity:.8"></div><div class="bar-lbl">${d.day}</div></div>`).join('');
}

/* ══════════════
   POSTS
══════════════ */
let POSTS_CACHE = [];

async function loadAllPosts() {
    const el = document.getElementById('postsTable');
    if (!el) return;
    el.innerHTML = `<div style="padding:20px;text-align:center;font-size:12px;color:rgba(255,255,255,.4)">⏳ Loading...</div>`;
    try {
        const q    = query(collection(db, 'posts'), orderBy('created_at', 'desc'), limit(100));
        const snap = await getDocs(q);
        POSTS_CACHE = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderPostsTable('ALL');
        renderRecentPosts(POSTS_CACHE.slice(0, 5));
        renderDonut(POSTS_CACHE);
    } catch(e) {
        el.innerHTML = `<div style="padding:20px;text-align:center;font-size:12px;color:var(--pink)">⚠️ ${e.message}</div>`;
    }
}

const TYPE_ICON = {exam:'📋',result:'🏆',answerkey:'🔑',admitcard:'🪪',library:'📚',sponsored:'📢'};

function renderPostsTable(filter = 'ALL') {
    const el = document.getElementById('postsTable');
    if (!el) return;
    const posts = filter === 'ALL' ? POSTS_CACHE : POSTS_CACHE.filter(p => p.type === filter);
    if (!posts.length) { el.innerHTML = `<div style="padding:20px;text-align:center;font-size:12px;color:rgba(255,255,255,.4)">Koi post nahi</div>`; return; }
    el.innerHTML = `
    <div class="posts-tbl-row posts-tbl-head"><div></div><div>Title</div><div>Views</div><div>Likes</div><div>Date</div><div>Actions</div></div>
    ${posts.map(p => `
    <div class="posts-tbl-row">
        <div class="ptbl-type">${TYPE_ICON[p.type]||'📄'}</div>
        <div><div class="ptbl-title">${p.title||'Untitled'}</div><div class="ptbl-sub">${p.el||''} · ${p.type||''}</div></div>
        <div class="ptbl-stat" style="color:var(--cyan)">${formatNum(p.views||0)}</div>
        <div class="ptbl-stat" style="color:var(--pink)">${formatNum(p.likes||0)}</div>
        <div class="ptbl-stat" style="font-size:10px;color:rgba(255,255,255,.4)">${p.pub_date||'—'}</div>
        <div style="display:flex;gap:5px">
            <button class="icon-btn edit" onclick="editPost('${p.id}')"><i class="bi bi-pencil-fill"></i></button>
            <button class="icon-btn del"  onclick="confirmDelete('${p.id}','${(p.title||'').replace(/'/g,'')}',this)"><i class="bi bi-trash-fill"></i></button>
        </div>
    </div>`).join('')}`;
}

function renderRecentPosts(posts) {
    const el = document.getElementById('recentPostsList');
    if (!el) return;
    el.innerHTML = posts.map(p => `
    <div class="post-row">
        <div class="pr-type" style="background:rgba(255,107,53,.12)">${TYPE_ICON[p.type]||'📄'}</div>
        <div class="pr-info"><div class="pr-title">${p.title||'Untitled'}</div><div class="pr-meta">${p.el||''} · ${p.pub_date||'—'}</div></div>
        <div class="pr-stats">
            <div class="pr-stat"><i class="bi bi-eye-fill" style="color:var(--purple)"></i>${formatNum(p.views||0)}</div>
            <div class="pr-stat"><i class="bi bi-heart-fill" style="color:var(--pink)"></i>${formatNum(p.likes||0)}</div>
        </div>
        <div class="pr-actions">
            <button class="icon-btn edit" onclick="editPost('${p.id}')"><i class="bi bi-pencil-fill"></i></button>
            <button class="icon-btn del"  onclick="confirmDelete('${p.id}','${(p.title||'').replace(/'/g,'')}',this)"><i class="bi bi-trash-fill"></i></button>
        </div>
    </div>`).join('');
}

function renderDonut(posts) {
    const el = document.getElementById('donutChart');
    if (!el) return;
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

window.filterPosts = (type, btn) => {
    document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    renderPostsTable(type);
};

window.confirmDelete = async (id, title, btn) => {
    if (!confirm(`"${title}" delete karna chahte hain?`)) return;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    btn.disabled = true;
    const ok = await deletePost(id);
    if (ok) {
        POSTS_CACHE = POSTS_CACHE.filter(p => p.id !== id);
        renderPostsTable('ALL');
        renderRecentPosts(POSTS_CACHE.slice(0,5));
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
        setF('f-title', post.title);
        setF('f-org',   post.org);
        setF('f-advt',  post.advt_no);
        setF('f-desc',  post.desc || post.short_notice);
        setF('f-pd',    post.pub_date);
        setF('f-el',    post.el);
        setF('f-ql',    post.ql);
        // Dates
        if (post.dates) {
            Object.entries(post.dates).forEach(([k, v]) => {
                const inp = document.getElementById('tl-' + k);
                if (inp) inp.value = v;
            });
        }
        window._editSlug = id;
        document.getElementById('formTitle').textContent = `✏️ Editing: ${post.title?.slice(0,25)}...`;
        toast('✏️ Post loaded for editing!');
    }, 300);
};

function setF(id, val) { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; }

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
    document.getElementById('cardForm').innerHTML   = buildCardForm();
    document.getElementById('fullForm').innerHTML   = buildFullForm(type);
    document.getElementById('fullFormWrap').style.display = type === 'sponsored' ? 'none' : 'block';
    if (!fromEdit) {
        window._editSlug = null;
        document.getElementById('step2').scrollIntoView({ behavior:'smooth', block:'start' });
    }
};

function buildCardForm() {
    return `
    <div class="form-row">
        <div class="form-g"><label>Post Title *</label><input type="text" id="f-title" placeholder="e.g. RRB Group D Recruitment 2026"></div>
        <div class="form-g"><label>Organization</label><input type="text" id="f-org" placeholder="e.g. RRB, SSC, UPSC"></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Advertisement Number</label><input type="text" id="f-advt" placeholder="e.g. CEN 09/2025"></div>
        <div class="form-g"><label>Published Date</label><input type="text" id="f-pd" value="${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}" placeholder="20 Feb 2026"></div>
    </div>
    <div class="form-g"><label>Short Description (Feed card mein dikhegi)</label><textarea id="f-desc" style="height:70px" placeholder="3–4 lines jo feed card mein dikhe..."></textarea></div>
    <div class="form-row">
        <div class="form-g"><label>Exam Label</label><select id="f-el"><option>SSC</option><option>UPSC</option><option>Railway</option><option>Bank</option><option>Teaching</option><option>Police</option><option>State</option><option>Defence</option><option>Other</option></select></div>
        <div class="form-g"><label>Qualification Label</label><select id="f-ql"><option>10th</option><option>12th</option><option>ITI</option><option>Diploma</option><option>Graduate</option><option>Post Graduate</option><option>Any</option></select></div>
    </div>
    <div class="form-g"><label>Card Accent Color</label><select id="f-ac"><option value="ca0">Orange–Pink</option><option value="ca1">Cyan–Purple</option><option value="ca2">Yellow–Orange</option><option value="ca3">Lime–Cyan</option></select></div>`;
}

function buildFullForm(type) {
    const datesHtml = `
    <div class="form-g" style="margin-top:8px"><label>📅 Important Dates (TBA likhein ya khali chhodein)</label>
        <div class="tl-builder" id="tlBuilder">
            ${dRow('notif_date','📢 Notification Date')}
            ${dRow('apply_start','📝 Apply Start')}
            ${dRow('apply_end','📅 Last Date Apply')}
            ${dRow('fee_payment_end','💳 Fee Payment End')}
            ${dRow('correction_start','✏️ Correction Start')}
            ${dRow('correction_end','✏️ Correction End')}
            ${dRow('admit_card','🪪 Admit Card','TBA')}
            ${dRow('exam_date','📋 Exam Date','TBA')}
            ${dRow('answer_key','🔑 Answer Key')}
            ${dRow('objection_end','⚠️ Objection End')}
            ${dRow('result','🏆 Result Date')}
            ${dRow('scrutiny','📂 Scrutiny/DV')}
            ${dRow('medical','🏥 Medical Exam')}
            ${dRow('merit_list','📊 Merit List')}
            ${dRow('joining','🎯 Joining Date')}
        </div>
        <div style="font-size:10px;color:rgba(255,229,0,.55);margin-top:5px">💡 "TBA" likhne par yellow TBA dikhega. Khali = auto Pending (grayed)</div>
    </div>`;

    const linksHtml = `
    <div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;margin:10px 0 7px">🔗 Important Links</div>
    <div class="form-row">
        <div class="form-g"><label>Apply Online</label><input type="url" id="f-l-apply" placeholder="https://..."></div>
        <div class="form-g"><label>Official Notification PDF</label><input type="url" id="f-l-notif" placeholder="https://...pdf"></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Revised Vacancy</label><input type="url" id="f-l-revised" placeholder="https://..."></div>
        <div class="form-g"><label>Official Website</label><input type="url" id="f-l-official" placeholder="https://..."></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Admit Card Link</label><input type="url" id="f-l-admit" placeholder="Baad mein add karein"></div>
        <div class="form-g"><label>Answer Key Link</label><input type="url" id="f-l-akey" placeholder="https://..."></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Result Link</label><input type="url" id="f-l-result" placeholder="https://..."></div>
        <div class="form-g"><label>Merit List Link</label><input type="url" id="f-l-merit" placeholder="https://..."></div>
    </div>`;

    if (type === 'exam' || type === 'admitcard') return `
    <div class="form-g"><label>Short Notice (Hero section)</label><textarea id="f-notice" style="height:60px" placeholder="1-2 line brief..."></textarea></div>
    <div class="form-row">
        <div class="form-g"><label>Total Posts *</label><input type="number" id="f-total" placeholder="e.g. 22195"></div>
        <div class="form-g"><label>Qualification Short</label><input type="text" id="f-qs" placeholder="e.g. 10th Pass / ITI"></div>
    </div>
    <div class="form-g"><label>Qualification Full Detail</label><textarea id="f-qual" style="height:55px" placeholder="e.g. Class 10 pass from NCVT/SCVT recognized board..."></textarea></div>
    <div class="form-row">
        <div class="form-g"><label>Nationality</label><input type="text" id="f-nat" value="Indian Citizen"></div>
        <div class="form-g"><label>Eligibility Note</label><input type="text" id="f-enote" placeholder="e.g. ITI holders get age relaxation"></div>
    </div>
    <!-- Age -->
    <div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;margin:10px 0 7px">👤 Age Limit</div>
    <div class="form-row">
        <div class="form-g"><label>Age Cutoff Date</label><input type="text" id="f-age-cut" placeholder="e.g. 01 January 2026"></div>
        <div class="form-g"><label>General Min / Max</label>
            <div style="display:flex;gap:6px"><input type="number" id="f-ag-min" placeholder="Min" style="flex:1"><input type="number" id="f-ag-max" placeholder="Max" style="flex:1"></div>
        </div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>OBC Max Age</label><input type="number" id="f-ao-max" placeholder="e.g. 36"></div>
        <div class="form-g"><label>SC/ST Max Age</label><input type="number" id="f-as-max" placeholder="e.g. 38"></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Female Relaxation</label><input type="text" id="f-af" placeholder="e.g. 5 years extra"></div>
        <div class="form-g"><label>PH Relaxation</label><input type="text" id="f-aph" placeholder="e.g. 10 years extra"></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Ex-SM Relaxation</label><input type="text" id="f-aex" placeholder="e.g. 3 years after service"></div>
        <div class="form-g"><label>Age Note</label><input type="text" id="f-anote" placeholder="e.g. As per regulations"></div>
    </div>
    <!-- Vacancy -->
    <div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;margin:10px 0 7px">💼 Vacancy Details</div>
    <div class="form-g"><label>Post-wise (Name | Seats — ek line ek post)</label>
        <textarea id="f-postwise" style="height:110px" placeholder="Track Maintainer Gr. IV | 11032&#10;Pointsman-B | 5053&#10;Assistant (S&T) | 1509&#10;Assistant (C&W) | 1000"></textarea>
    </div>
    <div class="form-g"><label>Reservation-wise (Category | Seats)</label>
        <textarea id="f-reservation" style="height:90px" placeholder="UR (General) | 8960&#10;OBC (NCL) | 5992&#10;SC | 3330&#10;ST | 1110&#10;EWS | 2221"></textarea>
    </div>
    <!-- Fee -->
    <div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;margin:10px 0 7px">💰 Application Fee</div>
    <div class="form-g"><label>Fee Rows (Category | Fee | Refund)</label>
        <textarea id="f-fee" style="height:90px" placeholder="General / OBC / EWS (Male) | ₹500 | ₹400&#10;SC / ST / EBC | ₹250 | ₹250&#10;Female (All) | ₹250 | ₹250&#10;PH / Ex-SM | ₹250 | ₹250"></textarea>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Refund Note</label><input type="text" id="f-refund-note" placeholder="e.g. Refund on appearing for CBT"></div>
        <div class="form-g"><label>Fee Note</label><input type="text" id="f-fee-note" placeholder="e.g. Online payment only"></div>
    </div>
    <div class="form-g"><label>Payment Methods (comma se)</label><input type="text" id="f-pmethods" value="Debit Card, Credit Card, Internet Banking, IMPS, UPI, Mobile Wallet"></div>
    <!-- Selection -->
    <div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;margin:10px 0 7px">🎯 Selection Process</div>
    <div class="form-g"><label>Steps (Step Name | Note — ek line)</label>
        <textarea id="f-selection" style="height:80px" placeholder="Computer Based Test (CBT) | Objective, 100 Qs, 90 min&#10;Physical Efficiency Test | Pass/Fail basis&#10;Document Verification | Originals required&#10;Medical Examination | Railway medical standards"></textarea>
    </div>
    ${datesHtml}
    ${linksHtml}`;

    if (type === 'result') return `
    <div class="form-g"><label>Short Notice</label><textarea id="f-notice" style="height:60px" placeholder="Result ke baare mein..."></textarea></div>
    <div class="form-row">
        <div class="form-g"><label>Total Registered</label><input type="text" id="f-reg" placeholder="e.g. 78.5 Lakh"></div>
        <div class="form-g"><label>Total Appeared</label><input type="text" id="f-app" placeholder="e.g. 52.3 Lakh"></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Total Qualified</label><input type="text" id="f-qual2" placeholder="e.g. 1.2 Lakh"></div>
        <div class="form-g"><label>Pass Rate</label><input type="text" id="f-prate" placeholder="e.g. 2.3%"></div>
    </div>
    <div class="form-g"><label>Cutoff (Category | Marks)</label>
        <textarea id="f-cutoff" style="height:80px" placeholder="General | 142.50&#10;OBC | 138.25&#10;SC | 128.00&#10;ST | 118.75&#10;EWS | 136.50"></textarea>
    </div>
    ${datesHtml}
    <div class="form-row">
        <div class="form-g"><label>Result Link</label><input type="url" id="f-l-result" placeholder="https://..."></div>
        <div class="form-g"><label>Notification PDF</label><input type="url" id="f-l-notif" placeholder="https://...pdf"></div>
    </div>
    <div class="form-g"><label>Next Step</label><textarea id="f-nextstep" style="height:50px" placeholder="e.g. Tier 2 schedule awaited / DV details..."></textarea></div>`;

    if (type === 'answerkey') return `
    <div class="form-g"><label>Short Notice</label><textarea id="f-notice" style="height:60px" placeholder="Answer key notice..."></textarea></div>
    <div class="form-row">
        <div class="form-g"><label>Objection Fee</label><input type="text" id="f-objfee" placeholder="e.g. ₹200 per question"></div>
        <div class="form-g"><label>Subjects (comma se)</label><input type="text" id="f-subjects" placeholder="e.g. Physics, Chemistry, Maths"></div>
    </div>
    ${datesHtml}
    <div class="form-row">
        <div class="form-g"><label>Answer Key PDF</label><input type="url" id="f-l-akey" placeholder="https://...pdf"></div>
        <div class="form-g"><label>Objection Portal</label><input type="url" id="f-l-obj" placeholder="https://..."></div>
    </div>
    <div class="form-g"><label>Official Website</label><input type="url" id="f-l-official" placeholder="https://..."></div>`;

    if (type === 'library') return `
    <div class="form-g"><label>Short Notice / Description</label><textarea id="f-notice" style="height:70px" placeholder="PDF ke baare mein detail..."></textarea></div>
    <div class="form-row">
        <div class="form-g"><label>PDF Link *</label><input type="url" id="f-pdf" placeholder="https://...pdf"></div>
        <div class="form-g"><label>Subject</label><select id="f-subject"><option>GS</option><option>Maths</option><option>Reasoning</option><option>English</option><option>Hindi</option><option>Science</option><option>History</option><option>Polity</option><option>Geography</option><option>Economy</option></select></div>
    </div>
    <div class="form-row">
        <div class="form-g"><label>Total Pages</label><input type="number" id="f-pages" placeholder="e.g. 45"></div>
        <div class="form-g"><label>File Size</label><input type="text" id="f-fsize" placeholder="e.g. 4.2 MB"></div>
    </div>
    <div class="form-g"><label>Tags (comma se)</label><input type="text" id="f-tags" placeholder="SSC, CGL, GS, History, UPSC"></div>`;

    if (type === 'sponsored') return `
    <div class="form-row">
        <div class="form-g"><label>Sponsor Name *</label><input type="text" id="f-title" placeholder="e.g. Adda247 Coaching"></div>
        <div class="form-g"><label>CTA Text</label><input type="text" id="f-cta" placeholder="Join Now / Apply Now"></div>
    </div>
    <div class="form-g"><label>Description</label><textarea id="f-desc" style="height:70px" placeholder="Ad content..."></textarea></div>
    <div class="form-row">
        <div class="form-g"><label>Link URL *</label><input type="url" id="f-l-apply" placeholder="https://..."></div>
        <div class="form-g"><label>Banner Image URL</label><input type="url" id="f-banner" placeholder="https://...image.jpg"></div>
    </div>`;

    return '';
}

function dRow(key, label, def = '') {
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px">
        <span style="font-size:10px;font-weight:600;color:rgba(255,255,255,.45);min-width:130px;flex-shrink:0">${label}</span>
        <input type="text" id="tl-${key}" value="${def}" placeholder="DD Mon YYYY / TBA / blank=Pending" style="flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:7px 10px;color:#fff;font-family:'Poppins',sans-serif;font-size:11px;outline:none">
    </div>`;
}

/* ══════════════
   COLLECT DATA
══════════════ */
function g(id) { return document.getElementById(id)?.value?.trim() || ''; }

function collectData() {
    // Dates
    const dates = {};
    ['notif_date','apply_start','apply_end','fee_payment_end','correction_start','correction_end',
     'admit_card','exam_date','answer_key','objection_end','result','scrutiny','medical','merit_list','joining']
    .forEach(k => { const v = g('tl-' + k); if (v) dates[k] = v; });

    // Parse pipe-separated textarea
    const parseLines = (id) => g(id).split('\n').filter(Boolean).map(l => {
        const p = l.split('|').map(x => x.trim());
        return p;
    });

    const postWise    = parseLines('f-postwise').filter(p => p.length >= 2).map(p => ({ name: p[0], seats: parseInt(p[1]) || 0 }));
    const reservation = parseLines('f-reservation').filter(p => p.length >= 2).map(p => ({ cat: p[0], seats: parseInt(p[1]) || 0 }));
    const feeRows     = parseLines('f-fee').filter(p => p.length >= 2).map(p => ({ cat: p[0], amt: p[1], refund: p[2] || null }));
    const selSteps    = parseLines('f-selection').filter(p => p.length >= 1).map(p => ({ name: p[0], note: p[1] || '' }));
    const cutoff      = parseLines('f-cutoff').filter(p => p.length >= 2).map(p => ({ cat: p[0], marks: p[1] }));

    const total = parseInt(g('f-total')) || postWise.reduce((a,b) => a + b.seats, 0) || 0;

    return {
        title:        g('f-title'),
        org:          g('f-org'),
        advt_no:      g('f-advt'),
        desc:         g('f-desc'),
        short_notice: g('f-notice') || g('f-desc'),
        el:           g('f-el'),
        ql:           g('f-ql') || g('f-qs'),
        pub_date:     g('f-pd'),
        ac:           g('f-ac') || 'ca0',
        type:         selectedType,
        tabs:         { exam:['HOME','EXAM'], result:['HOME','RESULT'], answerkey:['HOME','UPDATES'], admitcard:['HOME','UPDATES'], library:['HOME','LIBRARY'], sponsored:['HOME'] }[selectedType] || ['HOME'],

        seats: total ? { total, post_wise: postWise.length ? postWise : null, by_reservation: reservation.length ? reservation : null } : null,

        eligibility: g('f-qual') ? {
            qualification: g('f-qual'),
            qual_short:    g('f-qs') || g('f-ql'),
            nationality:   g('f-nat') || 'Indian Citizen',
            note:          g('f-enote'),
        } : null,

        age: g('f-ag-min') ? {
            cutoff_date: g('f-age-cut'),
            general: { min: parseInt(g('f-ag-min')), max: parseInt(g('f-ag-max')) },
            obc:     g('f-ao-max') ? { min: parseInt(g('f-ag-min')), max: parseInt(g('f-ao-max')) } : null,
            sc_st:   g('f-as-max') ? { min: parseInt(g('f-ag-min')), max: parseInt(g('f-as-max')) } : null,
            female:  g('f-af'), ph: g('f-aph'), ex_sm: g('f-aex'), note: g('f-anote'),
        } : null,

        fees: feeRows.length ? {
            rows:        feeRows,
            refund_note: g('f-refund-note'),
            note:        g('f-fee-note'),
            methods:     g('f-pmethods').split(',').map(m => m.trim()).filter(Boolean),
        } : null,

        selection: selSteps.length ? { steps: selSteps } : null,

        result_stats: g('f-reg') ? {
            registered: g('f-reg'), appeared: g('f-app'),
            qualified:  g('f-qual2'), pass_rate: g('f-prate'),
            cutoff:     cutoff,
        } : null,

        dates,

        links: Object.fromEntries(
            [['apply',g('f-l-apply')],['notification',g('f-l-notif')],['revised_vacancy',g('f-l-revised')],
             ['official_site',g('f-l-official')],['admit_card',g('f-l-admit')],['answer_key',g('f-l-akey')],
             ['result',g('f-l-result')],['merit_list',g('f-l-merit')],['objection',g('f-l-obj')]]
            .filter(([,v]) => v)
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
            <div style="font-size:9px;font-weight:700;color:var(--orange);margin-bottom:8px">📅 ${d.dates?.apply_end || d.dates?.exam_date || '—'} | 🕐 ${d.pub_date}</div>
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
        renderPostsTable('ALL');
        renderRecentPosts(POSTS_CACHE.slice(0,5));
    } catch(e) {
        toast('❌ Error: ' + e.message);
    }

    if (btn) { btn.innerHTML = orig; btn.disabled = false; }
};

window.closeSuccess = () => {
    document.getElementById('successModal').classList.remove('on');
    showPage('posts', document.querySelectorAll('.sb-item')[2]);
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
        const q    = query(collection(db, 'flagged_comments'), orderBy('created_at', 'desc'), limit(20));
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
    const ok = await saveSettings({
        site_name:  g('site-name'),
        tagline:    g('site-tagline'),
        telegram:   g('site-tg'),
        whatsapp:   g('site-wa'),
        instagram:  g('site-ig'),
    });
    toast(ok ? '✅ Site settings saved!' : '❌ Failed!');
};
window.saveFilterSettings = async () => {
    const ok = await saveSettings({ blocked_words: g('blockedWords') });
    toast(ok ? '✅ Filter saved!' : '❌ Failed!');
};
window.saveUPI = async () => {
    const ok = await saveSettings({ upi_id: g('upiId'), upi_qr: g('upiQr'), don_msg: g('donMsg') });
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
});
