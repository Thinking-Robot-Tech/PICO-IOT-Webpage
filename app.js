document.addEventListener('DOMContentLoaded', () => {

    // --- Get All Elements ---
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    
    // QR Scanner Modal Elements
    const qrScannerModal = document.getElementById('qrScannerModal');
    const simulateScanBtn = document.getElementById('simulateScanBtn');
    const cancelScanBtn = document.getElementById('cancelScanBtn');

    // Claim Code Modal Elements
    const claimCodeModal = document.getElementById('claimCodeModal');
    const claimCodeDisplay = document.getElementById('claimCodeDisplay');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const goToInstructionsBtn = document.getElementById('goToInstructionsBtn');

    // Instructions Modal Elements
    const instructionsModal = document.getElementById('instructionsModal');
    const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');

    // --- Generic Modal Control Functions ---
    function openModal(modal) {
        if (!modal) return; // Guard against null elements
        modal.classList.remove('hidden');
        // Use a timeout to allow the display property to apply before starting the transition
        setTimeout(() => {
            modal.classList.remove('modal-hidden');
            modal.classList.add('modal-visible');
        }, 10);
    }

    function closeModal(modal) {
        if (!modal) return; // Guard against null elements
        modal.classList.add('modal-hidden');
        modal.classList.remove('modal-visible');
        // Wait for the transition to finish before hiding the modal
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300); // Must match the CSS transition duration
    }

    // --- Event Listeners and Flow Logic ---

    // 1. User clicks the '+' button to start the process
    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', () => openModal(qrScannerModal));
    }

    // --- QR SCANNER MODAL ---
    // 2. User simulates a successful scan
    if (simulateScanBtn) {
        simulateScanBtn.addEventListener('click', () => {
            closeModal(qrScannerModal);
            
            // Generate and display a random 6-digit code
            const codePart1 = Math.floor(100 + Math.random() * 900);
            const codePart2 = Math.floor(100 + Math.random() * 900);
            const fullCode = `${codePart1}-${codePart2}`;
            if(claimCodeDisplay) claimCodeDisplay.textContent = fullCode;
            
            openModal(claimCodeModal);
        });
    }

    if (cancelScanBtn) {
        cancelScanBtn.addEventListener('click', () => closeModal(qrScannerModal));
    }


    // --- CLAIM CODE MODAL ---
    // 3. User wants to proceed to the connection instructions
    if (goToInstructionsBtn) {
        goToInstructionsBtn.addEventListener('click', () => {
            closeModal(claimCodeModal);
            openModal(instructionsModal);
        });
    }
    
    // Clipboard functionality
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
    // 4. User closes the final instructions modal
    if (closeInstructionsBtn) {
        closeInstructionsBtn.addEventListener('click', () => closeModal(instructionsModal));
    }

});
