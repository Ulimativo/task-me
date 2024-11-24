export function initializeProfileModal() {
    const profileBtn = document.querySelector('.profile-btn');
    const modal = document.querySelector('.profile-modal');
    const overlay = document.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.close-btn');

    function openModal() {
        overlay.style.display = 'block';
        modal.style.display = 'block';
        // Force reflow
        modal.offsetHeight;
        overlay.classList.add('active');
        modal.classList.add('active');
    }

    function closeModal() {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        
        // Wait for animations to finish before hiding
        setTimeout(() => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
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