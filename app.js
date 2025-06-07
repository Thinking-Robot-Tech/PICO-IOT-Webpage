import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    setPersistence,
    browserLocalPersistence, // Remember user across sessions
    browserSessionPersistence // Forget user when tab is closed
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    onValue, 
    set, 
    get 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// ===================================================================================
// === IMPORTANT: PASTE YOUR FIREBASE CONFIGURATION HERE ===
// ===================================================================================
const firebaseConfig = {
    apiKey: "AIzaSyATVt7ebZMz-6U3xr22tPexY55pLW3AWB8",
    authDomain: "pico-iot-5ae0c.firebaseapp.com",
    databaseURL: "https://pico-iot-5ae0c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pico-iot-5ae0c",
    storageBucket: "pico-iot-5ae0c.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};
// ===================================================================================


// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// --- Page routing based on auth state ---
// MODIFICATION: This logic is now more robust for different paths (localhost vs. GitHub Pages)
onAuthStateChanged(auth, user => {
    const path = window.location.pathname;
    // Checks if the current path ends with a relevant filename or is the root directory.
    const isLoginPage = path.endsWith('/') || path.endsWith('index.html');
    const isDashboardPage = path.endsWith('dashboard.html');

    if (user) {
        // User is signed in.
        if (isLoginPage) {
            console.log("User logged in, redirecting to dashboard.");
            // Replace 'index.html' or the trailing '/' with 'dashboard.html'
            window.location.href = window.location.href.replace(/(\/|index\.html)$/, '/dashboard.html');
        }
    } else {
        // User is signed out.
        if (isDashboardPage) {
            console.log("User not logged in, redirecting to login page.");
            window.location.href = window.location.href.replace('dashboard.html', 'index.html');
        }
    }
});


// --- Logic for the Login/Register Page (index.html) ---
const currentPagePath = window.location.pathname;
if (currentPagePath.endsWith('/') || currentPagePath.endsWith('index.html')) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');

    // Form switching
    const switchToRegister = document.getElementById('switch-to-register');
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        document.getElementById('form-title').innerText = 'Create Account';
        document.getElementById('footer-text').innerHTML = 'Already have an account? <a href="#" id="switch-to-login">Log In</a>';
        
        // Add listener for the new "Log In" link
        document.getElementById('switch-to-login').addEventListener('click', (e) => {
             e.preventDefault();
             window.location.reload(); // Easiest way to reset the form state
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
            .then(() => {
                return signInWithEmailAndPassword(auth, email, password);
            })
            .then((userCredential) => {
                // Redirect will be handled by onAuthStateChanged
            })
            .catch((error) => {
                errorMessage.textContent = `Login Failed: ${error.code}`;
                console.error(error);
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
            .then((userCredential) => {
                // Redirect will be handled by onAuthStateChanged
            })
            .catch((error) => {
                 errorMessage.textContent = `Registration Failed: ${error.code}`;
                 console.error(error);
            });
    });
}


// --- Logic for the Dashboard Page (dashboard.html) ---
if (window.location.pathname.endsWith('dashboard.html')) {
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const deviceGrid = document.getElementById('device-grid');
    const loadingSpinner = document.getElementById('loading-spinner');
    const noDevicesMessage = document.getElementById('no-devices-message');

    const deviceStatusTrackers = {}; 

    onAuthStateChanged(auth, user => {
        if (user) {
            userEmailDisplay.textContent = user.email;
            fetchDevices(user.uid);
        }
    });

    logoutButton.addEventListener('click', () => {
        signOut(auth).catch(error => console.error("Logout error", error));
    });

    async function fetchDevices(userId) {
        const devicesRef = ref(database, `users/${userId}/devices`);
        
        try {
            const snapshot = await get(devicesRef);
            loadingSpinner.classList.add('hidden');

            if (snapshot.exists()) {
                deviceGrid.classList.remove('hidden');
                const devices = snapshot.val();
                deviceGrid.innerHTML = '';
                for (const deviceId in devices) {
                    createDeviceCard(userId, deviceId);
                }
            } else {
                noDevicesMessage.classList.remove('hidden');
            }
        } catch(error) {
            console.error("Error fetching devices:", error);
            loadingSpinner.innerText = "Error loading devices.";
        }
    }

    function createDeviceCard(userId, deviceId) {
        const card = document.createElement('div');
        card.className = 'device-card';
        card.id = `device-${deviceId}`;

        card.innerHTML = `
            <div class="device-status" id="status-${deviceId}"></div>
            <div class="device-card-header">
                <h3>Device Relay</h3>
                <p>${deviceId}</p>
            </div>
            <div class="device-control">
                <h4>Switch Control</h4>
                <label class="switch">
                    <input type="checkbox" id="switch-${deviceId}">
                    <span class="slider"></span>
                </label>
            </div>
        `;
        deviceGrid.appendChild(card);

        const switchRef = ref(database, `users/${userId}/devices/${deviceId}/readdata/switch`);
        const statusRef = ref(database, `users/${userId}/devices/${deviceId}/writedata/message`);
        const toggle = card.querySelector(`#switch-${deviceId}`);
        const statusDot = card.querySelector(`#status-${deviceId}`);

        onValue(switchRef, (snapshot) => {
            const state = snapshot.val();
            toggle.checked = (state === true || state === 1);
        });

        toggle.addEventListener('change', () => {
            set(switchRef, toggle.checked);
        });
        
        onValue(statusRef, (snapshot) => {
            const newStatusValue = snapshot.val();

            if (!deviceStatusTrackers[deviceId]) {
                deviceStatusTrackers[deviceId] = {
                    lastValue: null,
                    timer: null
                };
            }
            const tracker = deviceStatusTrackers[deviceId];

            clearTimeout(tracker.timer);

            if (newStatusValue !== tracker.lastValue) {
                statusDot.className = 'device-status status-online';
                tracker.lastValue = newStatusValue;
            }
            
            tracker.timer = setTimeout(() => {
                statusDot.className = 'device-status status-offline';
            }, 5000); 
        });
    }
}
