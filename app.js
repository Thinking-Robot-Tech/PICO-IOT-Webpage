document.addEventListener('DOMContentLoaded', () => {

    // --- Get All Elements ---
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    
    // QR Scanner Modal
    const qrScannerModal = document.getElementById('qrScannerModal');
    const simulateScanBtn = document.getElementById('simulateScanBtn');
    const cancelScanBtn = document.getElementById('cancelScanBtn');

    // Claim Code Modal
    const claimCodeModal = document.getElementById('claimCodeModal');
    const claimCodeDisplay = document.getElementById('claimCodeDisplay');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const goToInstructionsBtn = document.getElementById('goToInstructionsBtn');

    // Instructions Modal
    const instructionsModal = document.getElementById('instructionsModal');
    const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');

    // --- Generic Modal Control Functions ---
    function openModal(modal) {
        if (!modal) return;
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('modal-hidden'), 10);
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.add('modal-hidden');
        setTimeout(() => modal.classList.add('hidden'), 300); // Match CSS transition time
    }

    // --- Event Listeners and Flow Logic ---

    // 1. User clicks the '+' button to start the process
    addDeviceBtn.addEventListener('click', () => {
        openModal(qrScannerModal);
    });

    // --- QR SCANNER MODAL ---
    // 2. User simulates a successful scan
    simulateScanBtn.addEventListener('click', () => {
        closeModal(qrScannerModal);
        
        // Generate and display a random 6-digit code
        const codePart1 = Math.floor(100 + Math.random() * 900);
        const codePart2 = Math.floor(100 + Math.random() * 900);
        const fullCode = `${codePart1}-${codePart2}`;
        claimCodeDisplay.textContent = fullCode;
        
        openModal(claimCodeModal);
    });

    cancelScanBtn.addEventListener('click', () => closeModal(qrScannerModal));

    // --- CLAIM CODE MODAL ---
    // 3. User wants to proceed to the connection instructions
    goToInstructionsBtn.addEventListener('click', () => {
        closeModal(claimCodeModal);
        openModal(instructionsModal);
    });
    
    // Clipboard functionality
    copyCodeBtn.addEventListener('click', () => {
        const codeToCopy = claimCodeDisplay.textContent;
        navigator.clipboard.writeText(codeToCopy).then(() => {
            const originalText = copyCodeBtn.innerHTML;
            copyCodeBtn.innerHTML = 'Copied!';
            copyCodeBtn.disabled = true;
            setTimeout(() => {
                 copyCodeBtn.innerHTML = originalText;
                 copyCodeBtn.disabled = false;
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy code: ', err);
            alert('Failed to copy code.');
        });
    });

    // --- INSTRUCTIONS MODAL ---
    // 4. User closes the final instructions modal
    closeInstructionsBtn.addEventListener('click', () => closeModal(instructionsModal));

});
