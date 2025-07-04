document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized before using its services
    if (typeof firebase === 'undefined') {
        console.error("Firebase not initialized. Make sure app.js is loaded first.");
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    let currentUser = null;

    // --- Auth Guard ---
    // Listen for auth state changes to protect the page
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            currentUser = user;
            console.log("Dashboard access granted for user:", currentUser.uid);
        } else {
            // No user is signed in. Redirect to the auth page.
            console.log("No user found, redirecting to auth page.");
            // Adjust the path based on your GitHub repository name.
            const repoName = 'PICO-IOT-Webpage'; 
            window.location.replace(`/${repoName}/auth.html`);
        }
    });

    // --- Get All Elements ---
    const signOutBtn = document.getElementById('signOutBtn');
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    
    // (Modal elements are the same as before)
    const qrScannerModal = document.getElementById('qrScannerModal');
    const qrVideo = document.getElementById('qrVideo');
    const qrCanvas = document.getElementById('qrCanvas');
    const qrCanvasContext = qrCanvas.getContext('2d');
    const loadingMessage = document.getElementById('loadingMessage');
    const cancelScanBtn = document.getElementById('cancelScanBtn');
    const openManualEntryBtn = document.getElementById('openManualEntryBtn');
    const manualEntryModal = document.getElementById('manualEntryModal');
    const manualIdInput = document.getElementById('manualIdInput');
    const submitManualIdBtn = document.getElementById('submitManualIdBtn');
    const cancelManualEntryBtn = document.getElementById('cancelManualEntryBtn');
    const claimCodeModal = document.getElementById('claimCodeModal');
    const claimCodeDisplay = document.getElementById('claimCodeDisplay');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const goToInstructionsBtn = document.getElementById('goToInstructionsBtn');
    const instructionsModal = document.getElementById('instructionsModal');
    const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');

    let videoStream = null;

    // --- Sign Out Logic ---
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log('User signed out successfully.');
                // The onAuthStateChanged listener will automatically handle the redirect.
            }).catch((error) => {
                console.error('Sign out error', error);
            });
        });
    }

    // --- Add Device Flow ---
    
    // This is the key new function. It generates a claim code and saves it to Firestore.
    async function generateAndStoreClaimCode(deviceId) {
        if (!currentUser) {
            alert("You must be logged in to claim a device.");
            return;
        }

        const codePart1 = Math.floor(100 + Math.random() * 900);
        const codePart2 = Math.floor(100 + Math.random() * 900);
        const fullCode = `${codePart1}-${codePart2}`;

        const userRef = db.collection('users').doc(currentUser.uid);
        const tenMinutes = 10 * 60 * 1000;
        const expiration = new Date(Date.now() + tenMinutes);

        try {
            await userRef.update({
                claimCode: {
                    code: fullCode,
                    deviceId: deviceId,
                    expiresAt: firebase.firestore.Timestamp.fromDate(expiration)
                }
            });
            console.log(`Claim code ${fullCode} stored for user ${currentUser.uid}`);
            
            // Now that the code is saved, show it to the user.
            if(claimCodeDisplay) claimCodeDisplay.textContent = fullCode;
            openModal(claimCodeModal);

        } catch (error) {
            console.error("Error storing claim code: ", error);
            alert("Could not generate a claim code. Please try again.");
        }
    }

    function handleSuccessfulScan(scannedData) {
        stopScanner();
        console.log("Scanned/Entered Data:", scannedData);

        const expectedPrefix = "PICO-IOT:";
        let deviceId = "";

        if (scannedData && scannedData.startsWith(expectedPrefix)) {
            deviceId = scannedData.substring(expectedPrefix.length);
        } else if (scannedData && scannedData.includes(':')) {
            deviceId = scannedData;
        }

        if (deviceId) {
            closeModal(qrScannerModal);
            closeModal(manualEntryModal);
            generateAndStoreClaimCode(deviceId); // Call the new Firestore function
        } else {
            alert("Invalid Device ID format. Please try again.");
            closeModal(qrScannerModal);
            closeModal(manualEntryModal);
        }
    }

    // --- All other modal and scanner logic remains the same ---
    // (The code for openModal, closeModal, startScanner, stopScanner, tick, and event listeners)
    
    function openModal(modal) { if (!modal) return; modal.classList.remove('hidden'); setTimeout(() => { modal.classList.remove('modal-hidden'); modal.classList.add('modal-visible'); }, 10); }
    function closeModal(modal) { if (!modal) return; modal.classList.add('modal-hidden'); modal.classList.remove('modal-visible'); setTimeout(() => { modal.classList.add('hidden'); }, 300); }
    function startScanner() { loadingMessage.textContent = "🎥 Requesting Camera Access..."; loadingMessage.classList.remove('hidden'); navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) { videoStream = stream; qrVideo.srcObject = stream; qrVideo.play(); loadingMessage.classList.add('hidden'); requestAnimationFrame(tick); }).catch(function(err) { console.error("Camera Error:", err); loadingMessage.textContent = "❌ Camera access denied."; }); }
    function stopScanner() { if (videoStream) { videoStream.getTracks().forEach(track => track.stop()); videoStream = null; } }
    function tick() { if (videoStream && qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) { qrCanvas.height = qrVideo.videoHeight; qrCanvas.width = qrVideo.videoWidth; qrCanvasContext.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height); const imageData = qrCanvasContext.getImageData(0, 0, qrCanvas.width, qrCanvas.height); const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" }); if (code) { handleSuccessfulScan(code.data); return; } } if(videoStream) { requestAnimationFrame(tick); } }
    if (addDeviceBtn) { addDeviceBtn.addEventListener('click', () => { openModal(qrScannerModal); startScanner(); }); }
    if (cancelScanBtn) { cancelScanBtn.addEventListener('click', () => { stopScanner(); closeModal(qrScannerModal); }); }
    if (openManualEntryBtn) { openManualEntryBtn.addEventListener('click', () => { stopScanner(); closeModal(qrScannerModal); openModal(manualEntryModal); }); }
    if (submitManualIdBtn) { submitManualIdBtn.addEventListener('click', () => { const manualId = manualIdInput.value; if (manualId) { handleSuccessfulScan(manualId); } else { alert("Please enter a Device ID."); } }); }
    if (cancelManualEntryBtn) { cancelManualEntryBtn.addEventListener('click', () => closeModal(manualEntryModal)); }
    if (goToInstructionsBtn) { goToInstructionsBtn.addEventListener('click', () => { closeModal(claimCodeModal); openModal(instructionsModal); }); }
    if (copyCodeBtn) { copyCodeBtn.addEventListener('click', () => { const codeToCopy = claimCodeDisplay.textContent; navigator.clipboard.writeText(codeToCopy).then(() => { const originalHTML = copyCodeBtn.innerHTML; copyCodeBtn.innerHTML = 'Copied!'; copyCodeBtn.disabled = true; setTimeout(() => { copyCodeBtn.innerHTML = originalHTML; copyCodeBtn.disabled = false; }, 1500); }).catch(err => { console.error('Failed to copy code: ', err); alert('Failed to copy code.'); }); }); }
    if (closeInstructionsBtn) { closeInstructionsBtn.addEventListener('click', () => closeModal(instructionsModal)); }
});
