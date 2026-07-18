// progress-legacy.js - Legacy progress tracking for old pages
// This file is kept for backward compatibility with pages using .topic-check selectors
// New pages should use /common/progress.js instead
document.addEventListener('DOMContentLoaded', () => {
    const progressBar = document.getElementById('main-progress');
    const checkboxes = document.querySelectorAll('.topic-check');
    const pageId = window.location.pathname; // Unique key for this topic

    // 1. Load saved state
    const savedState = JSON.parse(localStorage.getItem(pageId) || '{}');
    checkboxes.forEach(cb => {
        if (savedState[cb.dataset.target]) cb.checked = true;
    });

    const updateProgress = () => {
        const total = checkboxes.length;
        const checked = document.querySelectorAll('.topic-check:checked').length;
        const percentage = (checked / total) * 100;
        progressBar.style.width = percentage + '%';
        
        // Save to LocalStorage
        const state = {};
        checkboxes.forEach(cb => state[cb.dataset.target] = cb.checked);
        localStorage.setItem(pageId, JSON.stringify(state));
    };

    // 2. Manual Toggle
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateProgress);
    });

    // 3. Automatic "Scroll-to-Done" Logic
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -90% 0px', // Trigger when section passes the top 10% of screen
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Only mark as done if we are scrolling down
            if (entry.isIntersecting) {
                const id = entry.target.id || entry.target.querySelector('a')?.id;
                const checkbox = document.querySelector(`.topic-check[data-target="${id}"]`);
                if (checkbox && !checkbox.checked) {
                    checkbox.checked = true;
                    updateProgress();
                }
            }
        });
    }, observerOptions);

    // Observe all main headers that have IDs linked in bookmarks
    document.querySelectorAll('h2 [id], h3 [id], h2, h3').forEach(section => {
        if (section.id || section.querySelector('a')?.id) {
            observer.observe(section);
        }
    });

    // Initial calculation
    updateProgress();
});
