document.addEventListener('DOMContentLoaded', () => {

    // --- Get All Elements ---
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    
    // QR Scanner Modal Elements
    const qrScannerModal = document.getElementById('qrScannerModal');
    const qrVideo = document.getElementById('qrVideo');
    const qrCanvas = document.getElementById('qrCanvas');
    const qrCanvasContext = qrCanvas.getContext('2d');
    const loadingMessage = document.getElementById('loadingMessage');
    const cancelScanBtn = document.getElementById('cancelScanBtn');

    // Claim Code Modal Elements
    const claimCodeModal = document.getElementById('claimCodeModal');
    const claimCodeDisplay = document.getElementById('claimCodeDisplay');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const goToInstructionsBtn = document.getElementById('goToInstructionsBtn');

    // Instructions Modal Elements
    const instructionsModal = document.getElementById('instructionsModal');
    const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');

    let videoStream = null;

    // --- Generic Modal Control Functions ---
    function openModal(modal) {
        if (!modal) return;
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('modal-hidden');
            modal.classList.add('modal-visible');
        }, 10);
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.add('modal-hidden');
        modal.classList.remove('modal-visible');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    // --- QR SCANNER LOGIC ---
    function startScanner() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(function(stream) {
                videoStream = stream;
                qrVideo.srcObject = stream;
                loadingMessage.classList.add('hidden');
                qrVideo.play();
                requestAnimationFrame(tick); // Start the scanning loop
            })
            .catch(function(err) {
                console.error("Camera Error:", err);
                loadingMessage.textContent = "❌ Camera access denied.";
            });
    }

    function stopScanner() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }
    }

    function tick() {
        if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
            qrCanvas.height = qrVideo.videoHeight;
            qrCanvas.width = qrVideo.videoWidth;
            qrCanvasContext.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);
            const imageData = qrCanvasContext.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                // QR Code Found!
                handleSuccessfulScan(code.data);
                return; // Exit the loop
            }
        }
        // If no code is found, continue the loop
        if(videoStream) {
            requestAnimationFrame(tick);
        }
    }

    function handleSuccessfulScan(scannedData) {
        stopScanner();
        console.log("Scanned QR Code:", scannedData);

        // Optional: Add validation for the scanned data format
        if (scannedData && scannedData.startsWith("PICO-IOT:")) {
            closeModal(qrScannerModal);
            
            // Generate and display a random 6-digit code
            const codePart1 = Math.floor(100 + Math.random() * 900);
            const codePart2 = Math.floor(100 + Math.random() * 900);
            const fullCode = `${codePart1}-${codePart2}`;
            if(claimCodeDisplay) claimCodeDisplay.textContent = fullCode;
            
            openModal(claimCodeModal);
        } else {
            alert("Invalid PICO IoT QR code scanned. Please try again.");
            // Restart the scanner or close the modal
            closeModal(qrScannerModal);
        }
    }

    // --- Event Listeners and Flow Logic ---

    // 1. User clicks the '+' button
    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', () => {
            openModal(qrScannerModal);
            startScanner();
        });
    }

    // --- QR SCANNER MODAL ---
    if (cancelScanBtn) {
        cancelScanBtn.addEventListener('click', () => {
            stopScanner();
            closeModal(qrScannerModal);
        });
    }

    // --- CLAIM CODE MODAL ---
    if (goToInstructionsBtn) {
        goToInstructionsBtn.addEventListener('click', () => {
            closeModal(claimCodeModal);
            openModal(instructionsModal);
        });
    }
    
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', () => {
            const codeToCopy = claimCodeDisplay.textContent;
            navigator.clipboard.writeText(codeToCopy).then(() => {
                const originalHTML = copyCodeBtn.innerHTML;
                copyCodeBtn.innerHTML = 'Copied!';
                copyCodeBtn.disabled = true;
                setTimeout(() => {
                     copyCodeBtn.innerHTML = originalHTML;
                     copyCodeBtn.disabled = false;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy code: ', err);
                alert('Failed to copy code.');
            });
        });
    }

    // --- INSTRUCTIONS MODAL ---
    if (closeInstructionsBtn) {
        closeInstructionsBtn.addEventListener('click', () => closeModal(instructionsModal));
    }
});
