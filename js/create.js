/* =========================================
   CREATE POST TOOL LOGIC
   ========================================= */

// 1. MODAL OPEN/CLOSE
function openCreatePostModal() {
    const modal = document.getElementById('create-post-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Background scroll rokne ke liye
}

function closeCreatePostModal() {
    const modal = document.getElementById('create-post-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 2. TEXT AREA AUTO-RESIZE
// Jaise jaise likhenge, box bada hota jayega
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// 3. COLOR & ALIGNMENT LOGIC (Sabse Important)
// Ye function CSS classes badalta hai (Clean vs Colorful)
function applyColor(colorType, element) {
    const wrapper = document.getElementById('text-editor-wrapper');
    const textarea = document.getElementById('main-textarea');
    
    // Bubble Selection Highlight
    document.querySelectorAll('.color-circle').forEach(el => el.classList.remove('active-circle'));
    if(element) element.classList.add('active-circle');

    // LOGIC:
    if (colorType === 'none') {
        // --- RULE 1: COLOURLESS (White) ---
        // Text Align: Left & Top
        wrapper.style.background = 'var(--card-bg)';
        wrapper.classList.remove('style-colorful');
        wrapper.classList.add('style-clean');
        
        // Placeholder color fix
        textarea.style.color = 'var(--text-color)';
    } else {
        // --- RULE 2: COLOURFUL (Gradient/Solid) ---
        // Text Align: Center (All sides)
        wrapper.classList.remove('style-clean');
        wrapper.classList.add('style-colorful');
        
        // Background Set Karna
        if (colorType === 'grad-sunset') {
            wrapper.style.background = 'linear-gradient(135deg, #FF9A8B, #FF6A88)';
        } else if (colorType === 'grad-ocean') {
            wrapper.style.background = 'linear-gradient(135deg, #2AFADF, #4C83FF)';
        } else if (colorType.startsWith('#') || colorType.startsWith('rgb')) {
            wrapper.style.background = colorType; // Custom color ke liye
        }
    }
}

// 4. SWITCH POST MODES (Text, Quiz, Poll, Media)
function switchPostMode(mode, btnElement) {
    const dynamicArea = document.getElementById('dynamic-input-area');
    
    // Button Active State Change
    document.querySelectorAll('.chip-btn').forEach(el => el.classList.remove('active'));
    btnElement.classList.add('active');

    // Content Injection
    dynamicArea.classList.remove('d-none');
    dynamicArea.innerHTML = ''; // Purana content saaf karo

    if (mode === 'text') {
        dynamicArea.classList.add('d-none'); // Text mode me extra inputs nahi chahiye
    } 
    else if (mode === 'quiz') {
        dynamicArea.innerHTML = `
            <input type="text" class="cp-input" placeholder="Question (e.g. Capital of India?)">
            <div class="quiz-opt-row"><input type="radio" name="correct-ans" class="quiz-radio"><input type="text" class="cp-input mb-0" placeholder="Option A"></div>
            <div class="quiz-opt-row"><input type="radio" name="correct-ans" class="quiz-radio"><input type="text" class="cp-input mb-0" placeholder="Option B"></div>
            <div class="quiz-opt-row"><input type="radio" name="correct-ans" class="quiz-radio"><input type="text" class="cp-input mb-0" placeholder="Option C"></div>
            <div class="quiz-opt-row"><input type="radio" name="correct-ans" class="quiz-radio"><input type="text" class="cp-input mb-0" placeholder="Option D"></div>
            <textarea class="cp-input mt-2" placeholder="Explanation (Solution) - Optional"></textarea>
        `;
    } 
    else if (mode === 'poll') {
        dynamicArea.innerHTML = `
            <input type="text" class="cp-input" placeholder="Poll Question...">
            <input type="text" class="cp-input" placeholder="Option 1">
            <input type="text" class="cp-input" placeholder="Option 2">
            <input type="text" class="cp-input" placeholder="Option 3 (Optional)">
        `;
    } 
    else if (mode === 'media') {
        dynamicArea.innerHTML = `
            <div class="upload-box">
                <i class="bi bi-cloud-arrow-up-fill"></i>
                <span>Tap to upload image or video</span>
            </div>
            <textarea class="cp-input" placeholder="Caption..."></textarea>
        `;
    }
}

// 5. EXTENDED PICKER TOGGLE
function toggleExtendedPicker() {
    const picker = document.getElementById('extended-picker');
    if (picker.style.display === 'block') {
        picker.style.display = 'none';
    } else {
        picker.style.display = 'block';
        loadColorGrid(); // Grid load karo (Optional function)
    }
}

// 6. PUBLISH POST (Dummy Function)
function publishPost() {
    const text = document.getElementById('main-textarea').value;
    if(!text) {
        alert("Please write something!");
        return;
    }
    
    // Yahan Firebase Database ka code aayega future me
    alert("Post Published! (Test Mode)");
    closeCreatePostModal();
    
    // Reset Form
    document.getElementById('main-textarea').value = '';
    applyColor('none', null); // Reset to white
}

// Helper: Load Grid Colors (Optional - Simple implementation)
function loadColorGrid() {
    const grid = document.getElementById('grid-solid');
    if(grid.innerHTML !== '') return; // Already loaded hai to wapas mat karo

    const colors = ['#ff4d4d', '#ff9f43', '#feca57', '#1dd1a1', '#5f27cd', '#54a0ff', '#2e86de', '#222f3e', '#8395a7', '#ff6b6b', '#c8d6e5', '#10ac84'];
    
    colors.forEach(color => {
        let div = document.createElement('div');
        div.className = 'grid-item';
        div.style.backgroundColor = color;
        div.onclick = function() { applyColor(color, null); };
        grid.appendChild(div);
    });
}
