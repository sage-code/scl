/**
 * home.js - Home Page Specific Features
 * Included ONLY on the main index page
 */

document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("typewriter");
    const actions = document.getElementById("hero-actions");
    const fromRoadmapShortcut = window.location.hash === "#sage-code-roadmap";
    const heroMessage = `Master Software Engineering & Architecture
 * Follow expert roadmaps: Effective guides.
 * Study for free, at your own pace without ads. 
 * Build real projects: Gain actual experience.
Elite engineering: adapt, learn and prosper!
`;

    function toHtmlWithBreaks(text) {
        return text
            .trim()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>");
    }

    function getStorageFlag(key) {
        try {
            return window.localStorage.getItem(key) === "1" || window.sessionStorage.getItem(key) === "1";
        } catch (err) {
            return false;
        }
    }

    function setStorageFlag(key, scope = "local") {
        try {
            if (scope === "session") {
                window.sessionStorage.setItem(key, "1");
            } else {
                window.localStorage.setItem(key, "1");
            }
        } catch (err) {
            // Ignore storage failures in private browsing or restricted environments.
        }
    }

    function clearSessionFlag(key) {
        try {
            window.sessionStorage.removeItem(key);
        } catch (err) {
            // Ignore storage failures in private browsing or restricted environments.
        }
    }

    // Guard to prevent double execution
    if (container && !container.dataset.started) {
        container.dataset.started = "true";
        container.innerHTML = ""; // Clear initial state

        const hasSeenHeroBefore = getStorageFlag("sage.hero.typewriter.seen");
        const replayRequested = getStorageFlag("sage.hero.typewriter.replay");
        const shouldAnimate = !fromRoadmapShortcut && (!hasSeenHeroBefore || replayRequested);

        setStorageFlag("sage.hero.typewriter.seen", "local");
        clearSessionFlag("sage.hero.typewriter.replay");

        if (!shouldAnimate) {
            container.innerHTML = toHtmlWithBreaks(heroMessage);
            if (actions) {
                actions.classList.remove("opacity-0");
                actions.classList.add("opacity-100");
            }
            return;
        }

        let i = 0;

        function typeWriter() {
            if (i < heroMessage.length) {
                if (heroMessage.charAt(i) === "\n") {
                    container.innerHTML += "<br>";
                } else {
                    container.innerHTML += heroMessage.charAt(i);
                }
                i++;
                // Speed logic: slower on periods, faster on letters
                let speed = heroMessage.charAt(i - 1) === "." ? 400 : 45;
                setTimeout(typeWriter, speed);
            } else if (actions) {
                actions.classList.remove("opacity-0");
                actions.classList.add("opacity-100");
            }
        }
        
        // Start after a slight delay for font loading
        setTimeout(typeWriter, 800);
    }
});