/* =========================================
   FEED LOGIC & REALTIME POSTS
   ========================================= */

// App load hote hi posts sunna shuru karo
document.addEventListener('DOMContentLoaded', () => {
    loadRealPosts();
});

// 1. LOAD POSTS FROM FIREBASE (Realtime)
function loadRealPosts() {
    const feedContainer = document.getElementById('feed-container');
    
    // Agar HTML me container nahi hai to ruk jao
    if(!feedContainer) return;

    // Database Listener (Jaise hi koi post karega, ye turant dikhayega)
    db.collection("posts")
      .orderBy("timestamp", "desc") // Newest posts upar
      .onSnapshot((snapshot) => {
        
        feedContainer.innerHTML = ''; // Purana content saaf

        if (snapshot.empty) {
            feedContainer.innerHTML = '<div class="text-center p-4 text-muted">No posts yet. Be the first to post!</div>';
            return;
        }

        snapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;
            
            // Post HTML generate karo based on style
            const html = createPostHTML(post, postId);
            feedContainer.innerHTML += html;
        });
    }, (error) => {
        console.error("Error loading posts:", error);
        feedContainer.innerHTML = '<div class="text-center text-danger p-3">Error loading feed.</div>';
    });
}

// 2. HTML GENERATOR (Clean vs Colorful)
function createPostHTML(post, id) {
    // Default Avatar agar photo na ho
    const userPic = post.authorPic || "assets/user-placeholder.jpg";
    const userName = post.authorName || "Unknown User";
    
    // --- STYLE 1: COLORFUL (Center Text) ---
    if (post.type === 'colorful') {
        return `
        <div class="custom-card p-3" id="post-${id}">
            <div class="d-flex align-items-center mb-2">
                <img src="${userPic}" class="user-avatar-small me-2">
                <div>
                    <h6 class="mb-0 fw-bold">${userName}</h6>
                    <small class="text-muted">Just now</small>
                </div>
                <i class="bi bi-three-dots ms-auto header-icon" onclick="openKebabMenu()"></i>
            </div>
            
            <div class="styled-text-container" style="background: ${post.bgCode};">
                ${post.text}
            </div>
            
            <div class="d-flex justify-content-between mt-2 px-1 text-secondary post-actions">
                <span class="action-btn" onclick="toggleLike(this)"><i class="bi bi-heart"></i> ${post.likes || 0}</span>
                <span class="action-btn"><i class="bi bi-chat"></i> ${post.comments || 0}</span>
                <span class="action-btn" onclick="toggleSave(this)"><i class="bi bi-share"></i></span>
            </div>
        </div>`;
    } 
    
    // --- STYLE 2: CLEAN (White BG, Left Text) ---
    else {
        return `
        <div class="custom-card p-3" id="post-${id}">
            <div class="d-flex align-items-center mb-2">
                <img src="${userPic}" class="user-avatar-small me-2">
                <div>
                    <h6 class="mb-0 fw-bold">${userName}</h6>
                    <small class="text-muted">Just now</small>
                </div>
                <i class="bi bi-three-dots ms-auto header-icon" onclick="openKebabMenu()"></i>
            </div>
            
            <p class="simple-text-post">${post.text}</p>
            
            <div class="d-flex justify-content-between mt-2 px-1 text-secondary post-actions">
                <span class="action-btn" onclick="toggleLike(this)"><i class="bi bi-heart"></i> ${post.likes || 0}</span>
                <span class="action-btn"><i class="bi bi-chat"></i> ${post.comments || 0}</span>
                <span class="action-btn" onclick="toggleSave(this)"><i class="bi bi-share"></i></span>
            </div>
        </div>`;
    }
}

/* =========================================
   INTERACTION LOGIC (Like, Quiz, Save)
   ========================================= */

// 3. LIKE ANIMATION
function toggleLike(btnElement) {
    const icon = btnElement.querySelector('i');
    
    // Toggle Class
    btnElement.classList.toggle('liked');

    if (btnElement.classList.contains('liked')) {
        icon.classList.remove('bi-heart');
        icon.classList.add('bi-heart-fill');
        // Future: Update database here
    } else {
        icon.classList.remove('bi-heart-fill');
        icon.classList.add('bi-heart');
    }
}

// 4. SAVE / BOOKMARK
function toggleSave(btnElement) {
    const icon = btnElement.querySelector('i');
    btnElement.classList.toggle('saved');

    if (btnElement.classList.contains('saved')) {
        // Share logic or save logic
        alert("Link copied (Test)");
    }
}

// 5. SMART QUIZ LOGIC (For Quiz Posts)
function checkMCQ(element, selectedOption, correctOption) {
    const parent = element.parentElement;
    const solutionBox = parent.querySelector('.solution-content');

    if (parent.getAttribute('data-answered') === 'true') return;

    parent.setAttribute('data-answered', 'true');

    if (selectedOption === correctOption) {
        element.classList.add('correct');
    } else {
        element.classList.add('wrong');
        // Auto-show correct answer
        parent.querySelectorAll('.mcq-option').forEach(opt => {
            if (opt.getAttribute('data-opt') === correctOption) {
                opt.classList.add('correct');
            }
        });
    }

    if (solutionBox) solutionBox.style.display = 'block';
}

// 6. FLASHCARD FLIP
function toggleFlashcard(element) {
    element.classList.toggle('flipped');
}

// 7. OPEN MENU
function openKebabMenu() {
    // Bootstrap Offcanvas instance
    const el = document.getElementById('kebabMenu');
    if(el) {
        const bsOffcanvas = new bootstrap.Offcanvas(el);
        bsOffcanvas.show();
    }
}
