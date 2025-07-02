// Wait for the entire HTML document to be loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // Get the necessary elements from the DOM
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const instructionsModal = document.getElementById('instructionsModal');

    /**
     * Opens the instruction modal with a smooth slide-up animation.
     */
    function openModal() {
        // First, make the modal container visible
        instructionsModal.classList.remove('hidden');
        
        // Use a tiny timeout (10ms) to allow the browser to apply the 'display' change.
        // This ensures the slide-up transition is smooth.
        setTimeout(() => {
            instructionsModal.classList.remove('modal-hidden');
            instructionsModal.classList.add('modal-visible');
        }, 10);
    }

    /**
     * Closes the instruction modal with a smooth slide-down animation.
     */
    function closeModal() {
        instructionsModal.classList.remove('modal-visible');
        instructionsModal.classList.add('modal-hidden');
        
        // Wait for the slide-down animation to finish (300ms) before hiding the element completely.
        // This duration must match the transition duration in style.css.
        setTimeout(() => {
            instructionsModal.classList.add('hidden');
        }, 300);
    }

    // --- Event Listeners ---

    // Open the modal when the '+' button is clicked
    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', openModal);
    }

    // Close the modal when the 'X' button is clicked
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Close the modal if the user clicks on the dark background overlay
    if (instructionsModal) {
        instructionsModal.addEventListener('click', (event) => {
            // Check if the click was on the modal backdrop itself, not on the content
            if (event.target === instructionsModal) {
                closeModal();
            }
        });
    }

    // Optional: Close the modal with the 'Escape' key on a computer
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !instructionsModal.classList.contains('hidden')) {
            closeModal();
        }
    });

});
