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
// You can get this from your Firebase project settings.
const firebaseConfig = {
    apiKey: "AIzaSyATVt7ebZMz-6U3xr22tPexY55pLW3AWB8", // From your cred.h
    authDomain: "pico-iot-5ae0c.firebaseapp.com",
    databaseURL: "https://pico-iot-5ae0c-default-rtdb.asia-southeast1.firebasedatabase.app", // From your cred.h
    projectId: "pico-iot-5ae0c",
    storageBucket: "pico-iot-5ae0c.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};
// NOTE: It is safe to expose this configuration on the client-side.
// Security is handled by Firebase's Security Rules, not by hiding these keys.
// You may need to fill in `authDomain`, `projectId`, `storageBucket`, etc., from your Firebase console.
// ===================================================================================


// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// --- Page routing based on auth state ---
onAuthStateChanged(auth, user => {
    const currentPage = window.location.pathname;

    if (user) {
        // User is signed in.
        if (currentPage.includes("index.html") || currentPage === "/") {
            console.log("User logged in, redirecting to dashboard.");
            window.location.href = "dashboard.html";
        }
    } else {
        // User is signed out.
        if (currentPage.includes("dashboard.html")) {
            console.log("User not logged in, redirecting to login page.");
            window.location.href = "index.html";
        }
    }
});


// --- Logic for the Login/Register Page (index.html) ---
if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
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

        // Set session persistence based on "Remember Me"
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        
        setPersistence(auth, persistence)
            .then(() => {
                return signInWithEmailAndPassword(auth, email, password);
            })
            .then((userCredential) => {
                // Redirect will be handled by onAuthStateChanged
            })
            .catch((error) => {
                errorMessage.textContent = error.message;
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
                 errorMessage.textContent = error.message;
            });
    });
}


// --- Logic for the Dashboard Page (dashboard.html) ---
if (window.location.pathname.includes("dashboard.html")) {
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutButton = document.getElementById('logout-button');
    const deviceGrid = document.getElementById('device-grid');
    const loadingSpinner = document.getElementById('loading-spinner');
    const noDevicesMessage = document.getElementById('no-devices-message');

    const deviceStatusTrackers = {}; // To track online/offline status

    onAuthStateChanged(auth, user => {
        if (user) {
            // User is signed in, show their email and fetch devices
            userEmailDisplay.textContent = user.email;
            fetchDevices(user.uid);
        }
        // If not user, the router will redirect away.
    });

    // Logout logic
    logoutButton.addEventListener('click', () => {
        signOut(auth).catch(error => console.error("Logout error", error));
    });

    // Fetch devices for the logged-in user
    async function fetchDevices(userId) {
        const devicesRef = ref(database, `users/${userId}/devices`);
        
        try {
            const snapshot = await get(devicesRef);
            loadingSpinner.classList.add('hidden');

            if (snapshot.exists()) {
                deviceGrid.classList.remove('hidden');
                const devices = snapshot.val();
                deviceGrid.innerHTML = ''; // Clear existing cards
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

    // Create and manage a single device card
    function createDeviceCard(userId, deviceId) {
        const card = document.createElement('div');
        card.className = 'device-card';
        card.id = `device-${deviceId}`;

        // Basic card structure
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

        // --- Real-time listeners for the device ---
        const switchRef = ref(database, `users/${userId}/devices/${deviceId}/readdata/switch`);
        const statusRef = ref(database, `users/${userId}/devices/${deviceId}/writedata/message`);
        const toggle = card.querySelector(`#switch-${deviceId}`);
        const statusDot = card.querySelector(`#status-${deviceId}`);

        // Listen for switch state changes from Firebase
        onValue(switchRef, (snapshot) => {
            const state = snapshot.val();
            toggle.checked = (state === true || state === 1);
        });

        // Update Firebase when the user clicks the toggle
        toggle.addEventListener('change', () => {
            set(switchRef, toggle.checked);
        });
        
        // Listen for status changes (based on the random number)
        onValue(statusRef, (snapshot) => {
            const newStatusValue = snapshot.val();

            if (!deviceStatusTrackers[deviceId]) {
                // Initialize tracker for this device
                deviceStatusTrackers[deviceId] = {
                    lastValue: null,
                    timer: null
                };
            }
            const tracker = deviceStatusTrackers[deviceId];

            // Clear any existing timeout
            clearTimeout(tracker.timer);

            // If the value changed, device is online
            if (newStatusValue !== tracker.lastValue) {
                statusDot.className = 'device-status status-online';
                tracker.lastValue = newStatusValue;
            }
            
            // Set a timeout. If no new value arrives within 5 seconds,
            // assume the device is offline. Your ESP sends data every 2 seconds,
            // so 5 seconds is a safe buffer.
            tracker.timer = setTimeout(() => {
                statusDot.className = 'device-status status-offline';
            }, 5000); 
        });
    }
}
