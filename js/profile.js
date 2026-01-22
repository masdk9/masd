/* =========================================
   PROFILE & SETTINGS LOGIC
   ========================================= */

// 1. INITIAL SETUP (Listen for clicks)
document.addEventListener('DOMContentLoaded', () => {
    
    // Camera Icon par click hone par file select karo
    const camBadge = document.querySelector('.edit-cam-badge');
    if (camBadge) {
        camBadge.addEventListener('click', () => {
            // Hidden file input create karke click karo
            let fileInput = document.getElementById('hidden-file-input');
            if (!fileInput) {
                fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.id = 'hidden-file-input';
                fileInput.accept = 'image/*'; // Sirf photos allow karega
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                // Jab file select ho jaye
                fileInput.addEventListener('change', handleFileSelect);
            }
            fileInput.click();
        });
    }
});

// 2. IMAGE PREVIEW LOGIC
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // 1. Edit page par photo dikhao
            document.getElementById('edit-preview-img').src = e.target.result;
            
            // 2. Main Profile page par bhi turant dikha do (Optimistic Update)
            document.getElementById('profile-display-img').src = e.target.result;
        }
        
        reader.readAsDataURL(file);
    }
}

// 3. SAVE PROFILE CHANGES
function saveProfileChange() {
    const newName = document.getElementById('edit-name').value;
    const newBio = document.getElementById('edit-bio').value; // Abhi HTML me bio display nahi hai, par store kar sakte hain
    
    if (!newName) {
        alert("Name cannot be empty");
        return;
    }

    const user = firebase.auth().currentUser;
    
    if (user) {
        // A. Firebase Auth me update karo
        user.updateProfile({
            displayName: newName
            // PhotoURL bhi yahan update hoga jab hum Storage lagayenge
        }).then(() => {
            // B. UI Update Karo
            document.getElementById('profile-display-name').innerText = newName;
            
            // C. Success Message
            alert("Profile Updated Successfully!");
            closeSubPage(); // Wapas Profile Tab par jao
            
        }).catch((error) => {
            console.error(error);
            alert("Error updating profile");
        });
    } else {
        // Agar user login nahi hai (Test mode)
        document.getElementById('profile-display-name').innerText = newName;
        alert("Profile Updated (Local Mode)");
        closeSubPage();
    }
}

// 4. LOAD CURRENT DATA INTO EDIT FORM
// Jab "Edit Profile" page khule, to purana naam input box me pehle se likha hona chahiye
function loadEditData() {
    const currentName = document.getElementById('profile-display-name').innerText;
    document.getElementById('edit-name').value = currentName;
}

// "Edit Profile" button par ye function jodna padega (HTML me)
// HTML Update: <div class="menu-item" onclick="openSubPage('account-center'); loadEditData();"> ... </div>
// Maine niche ek auto-fix code likha hai jo ye kaam khud kar dega:

// Auto-attach listener to Edit button
const editBtn = document.querySelector('.menu-item[onclick*="account-center"]');
if(editBtn) {
    // Purana onclick hatake naya lagayenge ya merge karenge
    editBtn.onclick = function() {
        openSubPage('account-center');
        loadEditData();
    };
}
