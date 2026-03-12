/* ══════════════════
   DIGINOTES.NET — MAIN APP
════════════════════ */

import {
    fetchPosts, fetchSettings,
    isPostLiked, toggleLike,
    formatNum
} from 'https://masd.neocities.org/main/firebase-config.js';

/* ════ IDENTITY ════ */
const ANIMALS = ['🦆','🦊','🐼','🐯','🦁','🐸','🦉','🐺','🦋','🐬','🦅','🐨','🦝','🐮','🦜',
                 '🦓','🐻','🦒','🦘','🐧','🦩','🦚','🐙','🦈','🐝','🦡','🦫','🦦','🐿️','🦔'];
const NAMES   = [
  'Quick Learner','Sharp Mind','Night Owl','Star Student','Silent Reader',
  'Fast Thinker','Deep Reader','Bold Achiever','Bright Spark','Wise Owl',
  'Curious Soul','Top Ranker','Speed Reader','Smart Solver','Future Officer',
  'Exam Warrior','Study Ninja','Knowledge Seeker','Focused Mind','Calm Reader',
  'Rapid Learner','Strong Candidate','Dedicated Student','Rising Star','Daily Grinder',
  'Early Bird','Goal Setter','Hard Worker','Topper Mindset','Dream Chaser',
  'Consistent One','Silent Achiever','Motivated Mind','Exam Cracker','Steady Learner',
  'Determined Soul','Bright Future','Key Holder','Merit Student','Power Reader',
  'Final Ranker','Unstoppable','Mission Possible','Focus Champion','Clear Thinker',
  'Alert Mind','Brave Learner','Code Breaker','Deep Diver','Tireless Student'
];

function getMe() {
    let d = localStorage.getItem('dn_me');
    if (!d) {
        const num = Math.floor(Math.random() * 900) + 100; // 100–999
        d = JSON.stringify({
            a: ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
            n: NAMES[Math.floor(Math.random() * NAMES.length)],
            num: num
        });
        localStorage.setItem('dn_me', d);
    }
    // backward compat: add num if missing
    const parsed = JSON.parse(d);
    if (!parsed.num) {
        parsed.num = Math.floor(Math.random() * 900) + 100;
        localStorage.setItem('dn_me', JSON.stringify(parsed));
    }
    return parsed;
}
const ME = getMe();
// Display name: e.g. "🦊 Sharp Mind #247"  → 30 × 50 × 900 = 13,50,000 combinations
ME.display = ME.a + ' ' + ME.n + ' #' + ME.num;

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
</div></div></div>`).join('');
}

/* ═════════
   RENDER CARDS
════════════*/
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

/* ═════════
   BUILD CARD
════════════*/
function buildCard(p) {
    const slug    = p.slug || p.id;
    const liked   = isPostLiked(slug);
    const typeMap = { result:'lb-r', answerkey:'lb-u', admitcard:'lb-u', library:'lb-l' };
    const lbClass = typeMap[p.type] || 'lb-e';
    const acArr   = ['ca0','ca1','ca2','ca3'];
    const ac      = p.ac || acArr[slug.length % 4];
    const postUrl = `post2.html?id=${slug}`;

    // Last date / Posted date from new structure
    const ld = p.dates?.apply_end || p.dates?.exam_date || p.ld || '—';
    const pd = p.pd || (p.created_at?.toDate ? p.created_at.toDate().toLocaleDateString('en-IN') : '—');

    return `
<div class="pcard">
<div class="ca ${ac}"></div>
<div class="ci">

  <!-- Top: Labels + WA -->
  <div class="c-top">
    <div class="c-labs">
      <span class="lb ${lbClass}">${p.el || ''}</span>
      <span class="lb lb-q">${p.ql || ''}</span>
      ${p.type === 'sponsored' ? '<span class="lb lb-sp">Ad</span>' : ''}
    </div>
    <button class="ws-btn" onclick="shareWA('${slug}')"><i class="bi bi-whatsapp"></i></button>
  </div>

  <!-- Title + Desc -->
  <a href="${postUrl}" style="text-decoration:none;display:block">
    <div class="c-title">${p.title}</div>
    <div class="c-desc">${p.desc || ''}</div>
  </a>

  <!-- Dates -->
  <div class="c-dates">
    <div class="cd-i cd-l"><i class="bi bi-calendar2-check"></i> ${ld}</div>
    <span class="cd-sep">·</span>
    <div class="cd-i cd-p"><i class="bi bi-clock"></i> ${pd}</div>
  </div>

  <!-- Stats bar -->
  <div class="c-bot">
    <button class="stb stb-l ${liked ? 'liked' : ''}" onclick="tLike(this,'${slug}',${p.likes||0})">
      <i class="bi bi-heart${liked ? '-fill' : ''} si"></i>
      <span class="lc-${slug}">${formatNum(p.likes||0)}</span>
    </button>
    <a href="${postUrl}#comments" class="stb stb-c" style="text-decoration:none">
      <i class="bi bi-chat-dots si"></i>
      <span>${p.cmts || 0}</span>
    </a>
    <div class="stb stb-v">
      <i class="bi bi-eye si"></i>
      <span>${formatNum(p.views||0)}</span>
    </div>
    <a href="${postUrl}" class="stb stb-read" style="text-decoration:none">
      Read <i class="bi bi-arrow-right si"></i>
    </a>
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
    const url   = `${base}post2.html?id=${slug}`;
    window.open('https://wa.me/?text=' + encodeURIComponent(`📚 ${title}\n\n${url}`), '_blank');
}

/* ══════════════
   PROFILE PAGE
══════════════ */
function openPP() {
    document.getElementById('ppg').classList.add('on');
    document.body.style.overflow = 'hidden';
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
   TOOLS — OPEN/CLOSE
══════════════ */
function openTool(toolId) {
    document.getElementById('toolsPg').classList.remove('on');
    const el = document.getElementById('tool-' + toolId);
    if (el) {
        el.classList.add('on');
        document.body.style.overflow = 'hidden';
    }
}
function closeTool(toolId) {
    const el = document.getElementById('tool-' + toolId);
    if (el) el.classList.remove('on');
    document.body.style.overflow = '';
}

/* ── Age Calculator ── */
function calcAge() {
    const dob = document.getElementById('ac-dob').value;
    if (!dob) { document.getElementById('ac-result').innerHTML = '<span style="color:var(--red)">Date select karo!</span>'; return; }
    const birth = new Date(dob);
    const now   = new Date();
    let y = now.getFullYear() - birth.getFullYear();
    let m = now.getMonth()    - birth.getMonth();
    let d = now.getDate()     - birth.getDate();
    if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    const totalDays = Math.floor((now - birth) / 86400000);
    document.getElementById('ac-result').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px">
            <div style="background:rgba(0,122,255,.12);border:1px solid rgba(0,122,255,.25);border-radius:12px;padding:12px;text-align:center">
                <div style="font-size:1.6rem;font-weight:900;color:var(--blue2)">${y}</div>
                <div style="font-size:10px;color:var(--text2)">Years</div>
            </div>
            <div style="background:rgba(50,173,230,.1);border:1px solid rgba(50,173,230,.2);border-radius:12px;padding:12px;text-align:center">
                <div style="font-size:1.6rem;font-weight:900;color:var(--teal)">${m}</div>
                <div style="font-size:10px;color:var(--text2)">Months</div>
            </div>
            <div style="background:rgba(48,209,88,.1);border:1px solid rgba(48,209,88,.2);border-radius:12px;padding:12px;text-align:center">
                <div style="font-size:1.6rem;font-weight:900;color:var(--green)">${d}</div>
                <div style="font-size:10px;color:var(--text2)">Days</div>
            </div>
        </div>
        <div style="margin-top:10px;font-size:12px;color:var(--text2);text-align:center">
            Aap <strong style="color:var(--text)">${totalDays.toLocaleString('en-IN')}</strong> din jee chuke hain! 🎉
        </div>`;
}

/* ── Word Counter ── */
function countWords() {
    const txt  = document.getElementById('wc-input').value;
    const words = txt.trim() === '' ? 0 : txt.trim().split(/\s+/).length;
    const chars = txt.length;
    const charsNoSpace = txt.replace(/\s/g,'').length;
    const sentences = txt.split(/[.!?]+/).filter(s => s.trim()).length;
    const paras = txt.split(/\n\n+/).filter(p => p.trim()).length;
    document.getElementById('wc-result').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
            <div style="background:rgba(0,122,255,.12);border:1px solid rgba(0,122,255,.25);border-radius:12px;padding:12px;text-align:center">
                <div style="font-size:1.5rem;font-weight:900;color:var(--blue2)">${words.toLocaleString()}</div>
                <div style="font-size:10px;color:var(--text2)">Words</div>
            </div>
            <div style="background:rgba(50,173,230,.1);border:1px solid rgba(50,173,230,.2);border-radius:12px;padding:12px;text-align:center">
                <div style="font-size:1.5rem;font-weight:900;color:var(--teal)">${chars.toLocaleString()}</div>
                <div style="font-size:10px;color:var(--text2)">Characters</div>
            </div>
            <div style="background:rgba(48,209,88,.1);border:1px solid rgba(48,209,88,.2);border-radius:12px;padding:12px;text-align:center">
                <div style="font-size:1.5rem;font-weight:900;color:var(--green)">${charsNoSpace.toLocaleString()}</div>
                <div style="font-size:10px;color:var(--text2)">Chars (no space)</div>
            </div>
            <div style="background:rgba(255,159,10,.1);border:1px solid rgba(255,159,10,.2);border-radius:12px;padding:12px;text-align:center">
                <div style="font-size:1.5rem;font-weight:900;color:var(--orange)">${sentences}</div>
                <div style="font-size:10px;color:var(--text2)">Sentences</div>
            </div>
        </div>`;
}

/* ── Image Resizer ── */
function handleImgResize(e) {
    const file = e.target.files[0];
    if (!file) return;
    const img = document.getElementById('ir-preview');
    img.src = URL.createObjectURL(file);
    img.style.display = 'block';
    img.onload = () => {
        document.getElementById('ir-w').value = img.naturalWidth;
        document.getElementById('ir-h').value = img.naturalHeight;
        document.getElementById('ir-info').textContent = img.naturalWidth + ' × ' + img.naturalHeight + ' px';
    };
}
function doResize() {
    const img = document.getElementById('ir-preview');
    if (!img.src || img.style.display === 'none') { toast('⚠️ Pehle image select karo!'); return; }
    const w = parseInt(document.getElementById('ir-w').value);
    const h = parseInt(document.getElementById('ir-h').value);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.92);
    a.download = 'resized.jpg';
    a.click();
    toast('✅ Image download ho gayi!');
}
function lockAspect(changed) {
    const img = document.getElementById('ir-preview');
    if (!img.naturalWidth) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    if (changed === 'w') document.getElementById('ir-h').value = Math.round(parseInt(document.getElementById('ir-w').value) / ratio);
    else document.getElementById('ir-w').value = Math.round(parseInt(document.getElementById('ir-h').value) * ratio);
}

/* ── Image Cropper ── */
let cropImg = null, cropStartX, cropStartY, cropEndX, cropEndY, isCropping = false;
function handleCropImg(e) {
    const file = e.target.files[0];
    if (!file) return;
    const img = document.getElementById('ic-canvas-img');
    img.src = URL.createObjectURL(file);
    img.style.display = 'block';
    document.getElementById('ic-hint').style.display = 'none';
    cropImg = img;
}
function doCrop() {
    const img = cropImg;
    if (!img) { toast('⚠️ Pehle image select karo!'); return; }
    const x = parseInt(document.getElementById('ic-x').value)||0;
    const y = parseInt(document.getElementById('ic-y').value)||0;
    const w = parseInt(document.getElementById('ic-w').value)||img.naturalWidth;
    const h = parseInt(document.getElementById('ic-h').value)||img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const scaleX = img.naturalWidth  / img.offsetWidth;
    const scaleY = img.naturalHeight / img.offsetHeight;
    canvas.getContext('2d').drawImage(img, x*scaleX, y*scaleY, w*scaleX, h*scaleY, 0, 0, w, h);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.92);
    a.download = 'cropped.jpg';
    a.click();
    toast('✅ Cropped image download ho gayi!');
}

/* ── Photo+Sign Joiner ── */
function handleJoinImg(type, e) {
    const file = e.target.files[0];
    if (!file) return;
    const id = type === 'photo' ? 'pj-photo-prev' : 'pj-sign-prev';
    const img = document.getElementById(id);
    img.src = URL.createObjectURL(file);
    img.style.display = 'block';
}
function doJoin() {
    const photo = document.getElementById('pj-photo-prev');
    const sign  = document.getElementById('pj-sign-prev');
    if (!photo.src || photo.style.display==='none') { toast('⚠️ Photo select karo!'); return; }
    if (!sign.src  || sign.style.display==='none')  { toast('⚠️ Signature select karo!'); return; }
    const pw = parseInt(document.getElementById('pj-pw').value)||200;
    const ph = parseInt(document.getElementById('pj-ph').value)||230;
    const sw = parseInt(document.getElementById('pj-sw').value)||140;
    const sh = parseInt(document.getElementById('pj-sh').value)||60;
    const canvas = document.createElement('canvas');
    canvas.width  = pw + sw + 20;
    canvas.height = Math.max(ph, sh) + 20;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(photo, 0, (canvas.height - ph)/2, pw, ph);
    ctx.drawImage(sign,  pw + 20, (canvas.height - sh)/2, sw, sh);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.download = 'photo_sign_joined.jpg';
    a.click();
    toast('✅ Joined image download ho gayi!');
}

/* ── JPG to PDF ── */
async function doJpgToPdf() {
    const files = document.getElementById('jp-files').files;
    if (!files.length) { toast('⚠️ Images select karo!'); return; }
    toast('⏳ PDF ban raha hai...');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit:'px', format:'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < files.length; i++) {
        if (i > 0) pdf.addPage();
        await new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    const ratio = Math.min(pw/img.width, ph/img.height);
                    const w = img.width*ratio, h = img.height*ratio;
                    pdf.addImage(ev.target.result,'JPEG',(pw-w)/2,(ph-h)/2,w,h);
                    res();
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(files[i]);
        });
    }
    pdf.save('diginotes_converted.pdf');
    toast('✅ PDF download ho gaya!');
}

/* ── BG Remover (notice) ── */
/* ── PDF Compressor (notice) ── */

/* ══════════════
   GLOBAL EXPOSE
══════════════ */
Object.assign(window, {
    st, fc, tLike, shareWA, openPP, closePP, ppTab, openTools, closeTools,
    openTool, closeTool,
    calcAge, countWords,
    handleImgResize, doResize, lockAspect,
    handleCropImg, doCrop,
    handleJoinImg, doJoin,
    doJpgToPdf
});









