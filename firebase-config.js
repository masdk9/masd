/* ═══════════════════════════════════════════════
   DIGINOTES.NET — FIREBASE CONFIGURATION
   Ek baar config, dono jagah use hoga
   (index.html + admin.html dono mein include karo)
═══════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

// ── Firebase Config ──
const firebaseConfig = {
    apiKey:            "AIzaSyCVnKWwaQEh6APBiIFg3NwuUJpx-8vtdpU",
    authDomain:        "diginotes-v1.firebaseapp.com",
    projectId:         "diginotes-v1",
    storageBucket:     "diginotes-v1.firebasestorage.app",
    messagingSenderId: "544073986826",
    appId:             "1:544073986826:web:2d070b321a1bf7889e40f3",
    measurementId:     "G-655FTN7L0R"
};

// ── Initialize ──
const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const auth    = getAuth(app);
const storage = getStorage(app);

// ── Firestore Collections ──
const POSTS_COL    = 'posts';
const COMMENTS_COL = 'comments';
const LIKES_COL    = 'likes';
const SETTINGS_COL = 'settings';
const VIEWS_COL    = 'views';

// ── Slug Generator ──
function makeSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
        .replace(/\s+/g, '-')            // spaces to dashes
        .replace(/-+/g, '-')             // multiple dashes to one
        .trim()
        .slice(0, 80);                   // max 80 chars
}

// ═══════════════════════════════════════
// POST FUNCTIONS
// ═══════════════════════════════════════

// Sare posts fetch karo (feed ke liye)
async function fetchPosts(tabFilter = 'HOME', labelFilter = 'ALL') {
    try {
        let q = query(
            collection(db, POSTS_COL),
            where('status', '==', 'published'),
            orderBy('created_at', 'desc'),
            limit(50)
        );
        const snap = await getDocs(q);
        let posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Filter by tab
        if (tabFilter !== 'ALL') {
            posts = posts.filter(p => p.tabs?.includes(tabFilter));
        }
        // Filter by label
        if (labelFilter !== 'ALL') {
            posts = posts.filter(p => p.el === labelFilter || p.ql === labelFilter);
        }
        return posts;
    } catch (e) {
        console.error('fetchPosts error:', e);
        return [];
    }
}

// Ek post fetch karo (slug se)
async function fetchPostBySlug(slug) {
    try {
        const docRef = doc(db, POSTS_COL, slug);
        const snap   = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() };
        }
        return null;
    } catch (e) {
        console.error('fetchPostBySlug error:', e);
        return null;
    }
}

// Naya post create karo (admin)
async function createPost(postData) {
    try {
        const slug = makeSlug(postData.title);
        const docRef = doc(db, POSTS_COL, slug);
        await updateDoc(docRef, {
            ...postData,
            slug,
            likes:      0,
            views:      0,
            cmts:       0,
            status:     'published',
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        }).catch(async () => {
            // Doc doesn't exist, create it
            const { setDoc } = await import("https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js");
            await setDoc(docRef, {
                ...postData,
                slug,
                likes:      0,
                views:      0,
                cmts:       0,
                status:     'published',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });
        });
        return slug;
    } catch (e) {
        console.error('createPost error:', e);
        throw e;
    }
}

// Post update karo (admin)
async function updatePost(slug, data) {
    try {
        const docRef = doc(db, POSTS_COL, slug);
        await updateDoc(docRef, { ...data, updated_at: serverTimestamp() });
        return true;
    } catch (e) {
        console.error('updatePost error:', e);
        return false;
    }
}

// Post delete karo (admin)
async function deletePost(slug) {
    try {
        await deleteDoc(doc(db, POSTS_COL, slug));
        return true;
    } catch (e) {
        console.error('deletePost error:', e);
        return false;
    }
}

// View count badhaao
async function incrementView(slug) {
    try {
        await updateDoc(doc(db, POSTS_COL, slug), { views: increment(1) });
    } catch (e) {}
}

// ═══════════════════════════════════════
// LIKE FUNCTIONS
// ═══════════════════════════════════════

function getLikeKey(slug) {
    return `dn_like_${slug}`;
}

function isPostLiked(slug) {
    return localStorage.getItem(getLikeKey(slug)) === '1';
}

async function toggleLike(slug, currentLikes) {
    const liked = isPostLiked(slug);
    const newLikes = liked ? currentLikes - 1 : currentLikes + 1;
    try {
        await updateDoc(doc(db, POSTS_COL, slug), { likes: increment(liked ? -1 : 1) });
        if (liked) {
            localStorage.removeItem(getLikeKey(slug));
        } else {
            localStorage.setItem(getLikeKey(slug), '1');
        }
        return { liked: !liked, likes: newLikes };
    } catch (e) {
        console.error('toggleLike error:', e);
        return { liked, likes: currentLikes };
    }
}

// ═══════════════════════════════════════
// COMMENT FUNCTIONS
// ═══════════════════════════════════════

// Comments fetch karo
async function fetchComments(postSlug) {
    try {
        const q = query(
            collection(db, POSTS_COL, postSlug, COMMENTS_COL),
            orderBy('created_at', 'asc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error('fetchComments error:', e);
        return [];
    }
}

// Comment add karo
async function addComment(postSlug, text, animal, name) {
    // Filter check
    if (hasPhone(text) || hasUrl(text)) return { error: 'Phone/URL allowed nahi' };
    const filtered = filterBadWords(text);
    try {
        const ref = await addDoc(
            collection(db, POSTS_COL, postSlug, COMMENTS_COL),
            {
                text:       filtered,
                animal,
                name,
                likes:      0,
                replies:    [],
                created_at: serverTimestamp()
            }
        );
        // Update comment count on post
        await updateDoc(doc(db, POSTS_COL, postSlug), { cmts: increment(1) });
        return { id: ref.id, text: filtered, animal, name, likes: 0, replies: [] };
    } catch (e) {
        console.error('addComment error:', e);
        return { error: 'Comment post nahi hua' };
    }
}

// Reply add karo
async function addReply(postSlug, commentId, text, animal, name) {
    if (hasPhone(text) || hasUrl(text)) return { error: 'Phone/URL allowed nahi' };
    const filtered = filterBadWords(text);
    try {
        const cmtRef  = doc(db, POSTS_COL, postSlug, COMMENTS_COL, commentId);
        const cmtSnap = await getDoc(cmtRef);
        if (!cmtSnap.exists()) return { error: 'Comment nahi mila' };
        const existing = cmtSnap.data().replies || [];
        const newReply = {
            text: filtered, animal, name,
            likes: 0,
            time:  new Date().toLocaleDateString('en-IN')
        };
        await updateDoc(cmtRef, { replies: [...existing, newReply] });
        return newReply;
    } catch (e) {
        console.error('addReply error:', e);
        return { error: 'Reply nahi gayi' };
    }
}

// Comment delete karo (admin)
async function deleteComment(postSlug, commentId) {
    try {
        await deleteDoc(doc(db, POSTS_COL, postSlug, COMMENTS_COL, commentId));
        await updateDoc(doc(db, POSTS_COL, postSlug), { cmts: increment(-1) });
        return true;
    } catch (e) {
        return false;
    }
}

// ═══════════════════════════════════════
// SETTINGS FUNCTIONS
// ═══════════════════════════════════════

async function fetchSettings() {
    try {
        const snap = await getDoc(doc(db, SETTINGS_COL, 'site'));
        return snap.exists() ? snap.data() : {};
    } catch (e) {
        return {};
    }
}

async function saveSettings(data) {
    try {
        const { setDoc } = await import("https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js");
        await setDoc(doc(db, SETTINGS_COL, 'site'), { ...data, updated_at: serverTimestamp() }, { merge: true });
        return true;
    } catch (e) {
        return false;
    }
}

// ═══════════════════════════════════════
// IMAGE UPLOAD (Admin)
// ═══════════════════════════════════════

async function uploadImage(file, path) {
    try {
        const storageRef = ref(storage, `images/${path}/${Date.now()}_${file.name}`);
        const snap       = await uploadBytes(storageRef, file);
        const url        = await getDownloadURL(snap.ref);
        return { url, path: snap.ref.fullPath };
    } catch (e) {
        console.error('uploadImage error:', e);
        return { error: 'Upload failed' };
    }
}

// ═══════════════════════════════════════
// AUTH FUNCTIONS (Admin)
// ═══════════════════════════════════════

async function adminLogin(email, password) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return { user: cred.user };
    } catch (e) {
        return { error: e.message };
    }
}

async function adminLogout() {
    try {
        await signOut(auth);
        return true;
    } catch (e) {
        return false;
    }
}

// ═══════════════════════════════════════
// CONTENT FILTER
// ═══════════════════════════════════════

const BAD_WORDS = ['bekar', 'bakwas', 'gandu', 'mc', 'bc'];
function hasPhone(t)  { return /\d{10,}/.test(t); }
function hasUrl(t)    { return /https?:\/\/|www\./i.test(t); }
function filterBadWords(t) {
    let f = t;
    BAD_WORDS.forEach(w => f = f.replace(new RegExp(w, 'gi'), '***'));
    return f;
}

// ═══════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════

function formatNum(n) {
    if (!n) return '0';
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString();
}

function timeAgo(ts) {
    if (!ts) return '';
    const d    = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60)   return 'Abhi';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

// ═══════════════════════════════════════
// EXPORT — dono files use kar sakti hain
// ═══════════════════════════════════════

export {
    db, auth, storage,
    // Post
    fetchPosts, fetchPostBySlug, createPost, updatePost, deletePost, incrementView,
    // Like
    isPostLiked, toggleLike,
    // Comment
    fetchComments, addComment, addReply, deleteComment,
    // Settings
    fetchSettings, saveSettings,
    // Image
    uploadImage,
    // Auth
    adminLogin, adminLogout, onAuthStateChanged,
    // Utils
    makeSlug, formatNum, timeAgo, hasPhone, hasUrl, filterBadWords,
    // Firestore
    collection, doc, onSnapshot, query, orderBy, limit, where, serverTimestamp
};
