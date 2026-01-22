/* =========================================
   FEED INTERACTION LOGIC
   ========================================= */

// 1. MCQ / QUIZ LOGIC (Sabse Important)
// HTML me use karein: onclick="checkMCQ(this, 'A', 'B')" 
// (Jahan 'A' clicked option hai, aur 'B' sahi answer hai)

function checkMCQ(element, selectedOption, correctOption) {
    // Parent container dhundo taaki baki options disable kar sakein
    const parent = element.parentElement;
    const allOptions = parent.querySelectorAll('.mcq-option');
    const solutionBox = parent.querySelector('.solution-content');

    // Agar pehle se click ho chuka hai, to wapas kuch mat karo
    if (parent.getAttribute('data-answered') === 'true') return;

    // Mark as answered
    parent.setAttribute('data-answered', 'true');

    // CHECK LOGIC:
    if (selectedOption === correctOption) {
        // --- SAHI JAWAB ---
        element.classList.add('correct'); // Green color
        // Icon badalna (Optional)
        // element.innerHTML += ' <i class="bi bi-check-circle-fill float-end"></i>';
    } else {
        // --- GALAT JAWAB ---
        element.classList.add('wrong'); // Red color
        
        // Sahi wale ko dhund ke Green karo
        allOptions.forEach(opt => {
            if (opt.getAttribute('data-opt') === correctOption) {
                opt.classList.add('correct');
            }
        });
    }

    // Solution dikhana (Agar solution box maujood hai)
    if (solutionBox) {
        solutionBox.style.display = 'block';
    }
}

// 2. FLASHCARD FLIP LOGIC
// Card par click karne se palti marega
function toggleFlashcard(element) {
    // 'element' wo hai jis par click hua (.flashcard-inner)
    element.classList.toggle('flipped');
}

// 3. POST LIKE ANIMATION
function toggleLike(btnElement) {
    const icon = btnElement.querySelector('i');
    const countSpan = btnElement.querySelector('span'); // Agar number hai to
    
    // Toggle Class (CSS me .liked class ka color red hai)
    btnElement.classList.toggle('liked');

    if (btnElement.classList.contains('liked')) {
        // Liked State (Filled Heart)
        icon.classList.remove('bi-heart');
        icon.classList.add('bi-heart-fill');
        
        // Number badhao (Fake logic for UI)
        if(countSpan) {
            let current = parseInt(countSpan.innerText || 0);
            countSpan.innerText = " " + (current + 1);
        }
    } else {
        // Unliked State (Outline Heart)
        icon.classList.remove('bi-heart-fill');
        icon.classList.add('bi-heart');
        
        // Number ghatao
        if(countSpan) {
            let current = parseInt(countSpan.innerText || 0);
            countSpan.innerText = " " + (current > 0 ? current - 1 : 0);
        }
    }
}

// 4. BOOKMARK / SAVE LOGIC
function toggleSave(btnElement) {
    const icon = btnElement.querySelector('i');
    btnElement.classList.toggle('saved');

    if (btnElement.classList.contains('saved')) {
        icon.classList.remove('bi-bookmark');
        icon.classList.add('bi-bookmark-fill');
        // Toast msg dikha sakte hain: "Saved to collection"
    } else {
        icon.classList.remove('bi-bookmark-fill');
        icon.classList.add('bi-bookmark');
    }
}

// 5. KEBAB MENU (Open Bottom Sheet)
// Ye Bootstrap ke Offcanvas ko JS se control karega
function openKebabMenu() {
    const kebabEl = document.getElementById('kebabMenu');
    const bsOffcanvas = new bootstrap.Offcanvas(kebabEl);
    bsOffcanvas.show();
}

/* =========================================
   HELPER: DUMMY POST GENERATOR (Optional)
   (Iska use karke hum future me posts load karenge)
   ========================================= */
function createQuizHTML(question, optA, optB, optC, optD, correctAns, reason) {
    return `
    <div class="custom-card p-3">
        <div class="d-flex align-items-center mb-2">
            <img src="assets/user-placeholder.jpg" class="user-avatar-small me-2">
            <div><h6 class="mb-0 fw-bold">Daily Quiz</h6><small class="text-muted">2 mins ago</small></div>
        </div>
        
        <p class="fw-bold mb-3">${question}</p>
        
        <div class="quiz-options-container">
            <div class="mcq-option" data-opt="A" onclick="checkMCQ(this, 'A', '${correctAns}')">A. ${optA}</div>
            <div class="mcq-option" data-opt="B" onclick="checkMCQ(this, 'B', '${correctAns}')">B. ${optB}</div>
            <div class="mcq-option" data-opt="C" onclick="checkMCQ(this, 'C', '${correctAns}')">C. ${optC}</div>
            <div class="mcq-option" data-opt="D" onclick="checkMCQ(this, 'D', '${correctAns}')">D. ${optD}</div>
            
            <div class="solution-content">
                <div class="solution-box">
                    <strong>Reason:</strong> ${reason}
                </div>
            </div>
        </div>
        
        <div class="d-flex justify-content-between mt-3 px-1 text-secondary post-actions">
            <span class="action-btn" onclick="toggleLike(this)"><i class="bi bi-heart"></i> 12</span>
            <span class="action-btn"><i class="bi bi-chat"></i> 4</span>
            <span class="action-btn" onclick="toggleSave(this)"><i class="bi bi-bookmark"></i></span>
        </div>
    </div>
    `;
}
