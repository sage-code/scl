document.addEventListener('DOMContentLoaded', () => {
    const lang = document.body.getAttribute('data-lang');
    if (lang) {
        const script = document.createElement('script');
        script.src = `/assets/js/prism/prism-${lang}.min.js`;
        script.onload = () => {
            if (window.Prism) {
                Prism.highlightAll();
            }
        };
        document.head.appendChild(script);
    }
});