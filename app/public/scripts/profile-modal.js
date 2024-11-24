export function initializeProfileModal() {
    const profileBtn = document.querySelector('.profile-btn');
    const modal = document.querySelector('.profile-modal');
    const overlay = document.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.close-btn');

    // Ensure initial state
    modal.style.display = 'none';
    overlay.style.display = 'none';
    modal.classList.remove('active');
    overlay.classList.remove('active');

    function openModal() {
        // Reset any inline styles
        modal.style.removeProperty('display');
        overlay.style.removeProperty('display');
        
        // Force reflow
        modal.offsetHeight;
        
        // Add active classes
        overlay.classList.add('active');
        modal.classList.add('active');
    }

    function closeModal() {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        
        // Wait for animations to finish before hiding
        setTimeout(() => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        }, 300);
    }

    // Event listeners
    profileBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}