/* =========================================
   AUTHENTICATION LOGIC
   ========================================= */

// Firebase Auth Instance
const auth = firebase.auth();
const db = firebase.firestore(); // Agar future me user data save karna ho

// 1. AUTH STATE LISTENER (Sabse Important)
// Ye check karta hai ki user logged in hai ya nahi
auth.onAuthStateChanged((user) => {
    if (user) {
        // --- User Logged In Hai ---
        console.log("User logged in:", user.email);
        
        // Login screen chupao, App dikhao
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';

        // Profile Data Update karo (UI me)
        updateProfileUI(user);
    } else {
        // --- User Logged Out Hai ---
        console.log("User logged out");

        // App chupao, Login screen dikhao
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('auth-container').style.display = 'flex';
    }
});

// 2. SIGN UP FUNCTION
function handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-pass').value;

    if (!name || !email || !pass) {
        alert("Please fill all fields");
        return;
    }

    auth.createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            
            // User ka naam update karo
            user.updateProfile({
                displayName: name
            }).then(() => {
                // UI update aur Reload ki zarurat nahi, listener khud karega
                alert("Account created! Welcome " + name);
            });
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
}

// 3. LOGIN FUNCTION
function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (!email || !pass) {
        alert("Please enter email and password");
        return;
    }

    auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            // Successful login
            console.log("Logged in successfully");
        })
        .catch((error) => {
            alert("Login Failed: " + error.message);
        });
}

// 4. LOGOUT FUNCTION
function handleLogout() {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (confirmLogout) {
        auth.signOut().then(() => {
            // Sign-out successful.
            // UI apne aap listener se update hoga
        }).catch((error) => {
            console.error("Logout Error", error);
        });
    }
}

// 5. HELPER: SWITCH BETWEEN LOGIN & SIGNUP FORMS
function switchAuthMode(mode) {
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');

    if (mode === 'signup') {
        loginView.style.display = 'none';
        signupView.style.display = 'block';
    } else {
        signupView.style.display = 'none';
        loginView.style.display = 'block';
    }
}

// 6. HELPER: UPDATE PROFILE UI (Photo & Name)
function updateProfileUI(user) {
    // Profile Page par naam aur email lagana
    if(document.getElementById('profile-display-name')) {
        document.getElementById('profile-display-name').innerText = user.displayName || "Student";
        document.getElementById('profile-display-email').innerText = user.email;
    }
    
    // Agar photo URL hai to wo lagao, nahi to placeholder
    if (user.photoURL) {
        if(document.getElementById('profile-display-img'))
            document.getElementById('profile-display-img').src = user.photoURL;
    }
}
