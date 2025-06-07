import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
    apiKey: "AIzaSyATVt7ebZMz-6U3xr22tPexY55pLW3AWB8",
    authDomain: "pico-iot-5ae0c.firebaseapp.com",
    databaseURL: "https://pico-iot-5ae0c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pico-iot-5ae0c",
    storageBucket: "pico-iot-5ae0c.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// If user is already logged in, redirect them away from login page
onAuthStateChanged(auth, user => {
    if (user) {
        window.location.replace('dashboard.html');
    }
});

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const errorMessage = document.getElementById('error-message');

// Form switching
const switchToRegister = document.getElementById('switch-to-register');
const formTitle = document.getElementById('form-title');
const footerText = document.getElementById('footer-text');

switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    formTitle.innerText = 'Create Account';
    footerText.innerHTML = 'Already have an account? <a href="#" id="switch-to-login">Log In</a>';
    
    document.getElementById('switch-to-login').addEventListener('click', (e) => {
         e.preventDefault();
         registerForm.classList.add('hidden');
         loginForm.classList.remove('hidden');
         formTitle.innerText = 'Login';
         footerText.innerHTML = `Don't have an account? <a href="#" id="switch-to-register-inner">Sign Up</a>`;
         // You'd need to re-add the listener for the inner switch, or just reload. Simpler to manage state this way.
         window.location.reload();
    });
});

// Login logic
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    
    setPersistence(auth, persistence)
        .then(() => signInWithEmailAndPassword(auth, email, password))
        .then(() => {
            // Success. onAuthStateChanged will redirect.
        })
        .catch((error) => {
            errorMessage.textContent = `Login Failed: ${error.code.replace('auth/', '')}`;
        });
});

// Registration logic
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        errorMessage.textContent = "Passwords do not match.";
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            // Success. onAuthStateChanged will redirect.
        })
        .catch((error) => {
             errorMessage.textContent = `Registration Failed: ${error.code.replace('auth/', '')}`;
        });
});
