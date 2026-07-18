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

    // Auto-check on scroll removed. User fully controls check/uncheck state.

    // Initial calculation
    updateProgress();
});
