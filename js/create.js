/* =========================================
   CREATE POST TOOL LOGIC (REAL DATABASE)
   ========================================= */

// Ensure DB is initialized (from firebase-cfg.js)
// const db = firebase.firestore(); 

// 1. MODAL OPEN/CLOSE
function openCreatePostModal() {
    const modal = document.getElementById('create-post-modal');
    if(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Background scroll rokne ke liye
    }
}

function closeCreatePostModal() {
    const modal = document.getElementById('create-post-modal');
    if(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// 2. TEXT AREA AUTO-RESIZE
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// 3. COLOR & ALIGNMENT LOGIC
function applyColor(colorType, element) {
    const wrapper = document.getElementById('text-editor-wrapper');
    const textarea = document.getElementById('main-textarea');
    
    // Bubble Selection Highlight
    document.querySelectorAll('.color-circle').forEach(el => el.classList.remove('active-circle'));
    if(element) element.classList.add('active-circle');

    // LOGIC:
    if (colorType === 'none') {
        // --- RULE 1: CLEAN (White) -> Left & Top ---
        wrapper.style.background = 'var(--card-bg)';
        wrapper.classList.remove('style-colorful');
        wrapper.classList.add('style-clean');
        textarea.style.color = 'var(--text-color)';
    } else {
        // --- RULE 2: COLORFUL -> Center ---
        wrapper.classList.remove('style-clean');
        wrapper.classList.add('style-colorful');
        
        // Background Set Karna
        if (colorType === 'grad-sunset') {
            wrapper.style.background = 'linear-gradient(135deg, #FF9A8B, #FF6A88)';
        } else if (colorType === 'grad-ocean') {
            wrapper.style.background = 'linear-gradient(135deg, #2AFADF, #4C83FF)';
        } else if (colorType.startsWith('#') || colorType.startsWith('rgb')) {
            wrapper.style.background = colorType; 
        }
        textarea.style.color = '#fff';
    }
}

// 4. SWITCH POST MODES (Text, Quiz, Poll)
function switchPostMode(mode, btnElement) {
    const dynamicArea = document.getElementById('dynamic-input-area');
    
    // Button Active State
    document.querySelectorAll('.chip-btn').forEach(el => el.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');

    // Reset Content
    dynamicArea.classList.remove('d-none');
    dynamicArea.innerHTML = ''; 

    if (mode === 'text') {
        dynamicArea.classList.add('d-none'); 
    } 
    else if (mode === 'quiz') {
        dynamicArea.innerHTML = `
            <input type="text" id="quiz-question" class="cp-input" placeholder="Question?">
            <div class="quiz-opt-row"><input type="radio" name="correct" value="A"><input type="text" id="opt-a" class="cp-input mb-0" placeholder="Option A"></div>
            <div class="quiz-opt-row"><input type="radio" name="correct" value="B"><input type="text" id="opt-b" class="cp-input mb-0" placeholder="Option B"></div>
        `;
    } 
    // (Poll/Media logic can be added here similarly)
}

// 5. PUBLISH POST (REAL FIREBASE CODE)
function publishPost() {
    const text = document.getElementById('main-textarea').value;
    const wrapper = document.getElementById('text-editor-wrapper');
    const user = firebase.auth().currentUser;

    // A. Validation
    if (!user) {
        alert("Please Login first to post!");
        return;
    }
    if (!text.trim()) {
        alert("Post cannot be empty!");
        return;
    }

    // B. Detect Style (Clean vs Colorful)
    let postType = 'clean';
    let bgCode = 'var(--card-bg)';

    if (wrapper.classList.contains('style-colorful')) {
        postType = 'colorful';
        bgCode = wrapper.style.background; // Jo gradient/color set hai use uthao
    }

    // C. Save to Firebase Firestore
    // Note: Make sure Cloud Firestore database is created in Firebase Console
    db.collection("posts").add({
        authorName: user.displayName || "Student",
        authorId: user.uid,
        authorPic: user.photoURL || "assets/user-placeholder.jpg",
        text: text,
        type: postType,     // 'clean' or 'colorful'
        bgCode: bgCode,     // CSS color string
        timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Server ka time
        likes: 0,
        comments: 0
    })
    .then((docRef) => {
        console.log("Post written with ID: ", docRef.id);
        
        // Success UI
        alert("Post Published Successfully!");
        closeCreatePostModal();
        
        // Reset Everything
        document.getElementById('main-textarea').value = '';
        applyColor('none', null); // Wapas white kar do
    })
    .catch((error) => {
        console.error("Error adding post: ", error);
        alert("Error publishing post: " + error.message);
    });
}

// 6. HELPER: Toggle Extended Color Picker
function toggleExtendedPicker() {
    const picker = document.getElementById('extended-picker');
    if (picker.style.display === 'block') {
        picker.style.display = 'none';
    } else {
        picker.style.display = 'block';
        loadColorGrid();
    }
}

function loadColorGrid() {
    const grid = document.getElementById('grid-solid');
    if(grid.innerHTML !== '') return; 

    const colors = ['#ff4d4d', '#ff9f43', '#feca57', '#1dd1a1', '#5f27cd', '#54a0ff', '#222f3e', '#8395a7'];
    
    colors.forEach(color => {
        let div = document.createElement('div');
        div.className = 'grid-item';
        div.style.backgroundColor = color;
        div.onclick = function() { applyColor(color, null); };
        grid.appendChild(div);
    });
}
