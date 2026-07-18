// sidebar.js - Centralized sidebar management for old pages
// Used by legacy engineering pages with hardcoded .topic-check selectors
document.addEventListener('DOMContentLoaded', () => {
    const pageKey = window.location.pathname; 
    const progressBar = document.getElementById('main-progress');
    const checkboxes = document.querySelectorAll('.topic-check');
    const sidebar = document.getElementById('study-sidebar');
    const openBtn = document.getElementById('open-sidebar');
    const closeBtn = document.getElementById('close-sidebar');

    // --- 1. Progress & Storage ---
    const updateProgressBar = () => {
        if (!progressBar) return;
        const total = checkboxes.length;
        const checked = document.querySelectorAll('.topic-check:checked').length;
        progressBar.style.width = total > 0 ? `${(checked / total) * 100}%` : '0%';
    };

    const saveProgress = () => {
        const state = {};
        checkboxes.forEach(cb => state[cb.dataset.target] = cb.checked);
        localStorage.setItem(pageKey, JSON.stringify(state));
        updateProgressBar();
    };

    const loadProgress = () => {
        const saved = JSON.parse(localStorage.getItem(pageKey) || '{}');
        checkboxes.forEach(cb => {
            if (saved[cb.dataset.target]) cb.checked = true;
        });
        updateProgressBar();
    };

    // --- 2. Auto-Check Removed ---
    // Progress state is fully manual (user toggles checkboxes).

    
    // --- 3. Interaction & Mobile Toggle ---
    if (openBtn && sidebar) {
        openBtn.addEventListener('click', () => {
            // Toggle the 'active' class on the sidebar
            sidebar.classList.toggle('active');

            // Optional: Change the button icon for better UX
            const icon = openBtn.querySelector('span');
            if (sidebar.classList.contains('active')) {
                icon.textContent = '✕'; // Change to "X"
            } else {
                icon.textContent = '☰'; // Change back to Hamburger
            }
        });
    }

    // Close when clicking a link on mobile
    document.querySelectorAll('#bookmark-list a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992 && sidebar) {
                sidebar.classList.remove('active');
            }
        });
    });

    // Initialize Checkboxes (manual toggle only)
    checkboxes.forEach(cb => {
        cb.addEventListener('change', saveProgress);
    });

    loadProgress();
});
