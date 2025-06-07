import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

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
const database = getDatabase(app);

const userEmailDisplay = document.getElementById('user-email-display');
const logoutButton = document.getElementById('logout-button');
const deviceGrid = document.getElementById('device-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const noDevicesMessage = document.getElementById('no-devices-message');
const deviceStatusTrackers = {}; 

// This is a protected page. Check auth state immediately.
onAuthStateChanged(auth, user => {
    if (user) {
        // User is signed in. Proceed to load dashboard content.
        userEmailDisplay.textContent = user.email;
        fetchDevices(user.uid);
    } else {
        // User is not signed in. Redirect to login page.
        window.location.replace('login.html');
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
            deviceStatusTrackers[deviceId] = { lastValue: null, timer: null };
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
