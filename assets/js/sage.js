/**
 * sage.js - Global Logic for sagecode.org
 * Handles the Dynamic Header and Alignment
 */

const HERO_CARET_UP_SVG = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/></svg>';
const HERO_CARET_DOWN_SVG = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>';

document.addEventListener("DOMContentLoaded", function () {
    normalizeLocalPublicLinks();
    initDynamicHeader();
    initNavAuthLink();
    initHeroVisibilityToggle();
    wireHomeLogoTypewriterTrigger();
    initTooltips();
    forceCodeViewerSameTab();
});

/**
 * Activate the Bootstrap tooltips declared in markup with
 * data-bs-toggle="tooltip". Bootstrap 5 needs one constructor call per
 * element, so without this the data attributes stay inert and only the
 * native title hint shows up on hover.
 *
 * Pages that never load bootstrap.bundle.js are skipped silently, which
 * keeps the shared script usable by every layout.
 */
function initTooltips() {
    if (typeof window.bootstrap === "undefined" || !window.bootstrap.Tooltip) {
        return;
    }

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function (node) {
        window.bootstrap.Tooltip.getOrCreateInstance(node);
    });
}

function initDynamicHeader() {
    const header = document.getElementById('dynamic-header');
    if (!header) return;

    // If build already embedded a static header, keep it and only wire interactions.
    if (header.querySelector('#nav-menu')) {
        renderBreadcrumbs();
        wireHamburgerMenu();
        return;
    }

    // justify-content-between pushes the two columns to the opposite edges
    let headerHTML = `
        <div class="row align-items-center g-0 justify-content-between">
            <div class="col-auto ps-0 p-0 m-0">
                <a href="/" aria-label="Sage-Code home">
                    <img src="/assets/images/sage-logo.svg" alt="Sage-Code" height="50" style="display: block;">
                </a>
            </div>
            
            <div class="col-auto pe-0">     
                <nav class="main-nav">
                    <button class="hamburger" id="hamburger-btn" type="button" aria-controls="nav-menu" aria-expanded="false" aria-label="Toggle navigation">
                        <span></span><span></span><span></span>
                    </button>
                    <ul class="nav-links" id="nav-menu">
                        <li><a href="/roadmap/">Roadmap</a></li>
                        <li><a href="/projects/">Projects</a></li>
                        <li><a href="/services.html">Services</a></li>
                        <li><a href="/community/">Community</a></li>
                        <li><a href="/roadmap/login.html" id="nav-auth-link" data-auth-state="signed-out">Sign In</a></li>
                    </ul>
                </nav>
            </div>
        </div>
        
        <div class="row g-0 mt-0 p-0">
            <div class="col ps-0">
                <div class="breadcrumb-row">
                    <nav class="breadcrumb-nav" id="breadcrumb-nav" aria-label="Breadcrumb">${generateBreadcrumbs()}</nav>
                    <button
                        id="hero-visibility-toggle"
                        class="hero-visibility-toggle"
                        type="button"
                        aria-label="Hide hero section"
                        aria-controls="sage-hero-section"
                        aria-expanded="true"
                        title="Toggle hero section"
                    >
                        ${HERO_CARET_UP_SVG}
                    </button>
                </div>
            </div>
        </div>`;


    header.innerHTML = headerHTML;
    renderBreadcrumbs();
    wireHamburgerMenu();
}

function getSiteRoot() {
    const path = window.location.pathname || '/';
    if (path.startsWith('/public/')) {
        return `${window.location.origin}/public`;
    }
    if (path === '/public' || path === '/public/') {
        return `${window.location.origin}/public`;
    }
    return window.location.origin;
}

function renderBreadcrumbs() {
    const breadcrumbEl = document.getElementById('breadcrumb-nav');
    if (!breadcrumbEl) return;
    breadcrumbEl.innerHTML = generateBreadcrumbs();
}

function forceCodeViewerSameTab() {
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href*="code-viewer.html"]');
        if (link) {
            const href = link.getAttribute('href');
            if (event.ctrlKey || event.metaKey || event.button === 1) {
                event.preventDefault();
                window.location.href = href;
            }
        }
    }, true);
}

function normalizeLocalPublicLinks() {
    const path = window.location.pathname || '/';
    const isLocalPublic = path === '/public' || path === '/public/' || path.startsWith('/public/');
    if (!isLocalPublic) return;

    const anchors = document.querySelectorAll('a[href^="/"]');
    anchors.forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('//')) return;
        if (href.startsWith('/public/')) return;
        anchor.setAttribute('href', `/public${href}`);
    });
}

function wireHamburgerMenu() {
    const btn = document.getElementById('hamburger-btn');
    const menu = document.getElementById('nav-menu');
    if (btn && menu) {
        btn.addEventListener('click', () => {
            const isOpen = menu.classList.toggle('active');
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }
}

function initNavAuthLink() {
    const authLink = document.getElementById('nav-auth-link');
    if (!authLink) return;

    const path = window.location.pathname || '/';
    const loginHref = path.startsWith('/public/') ? '/public/roadmap/login.html' : '/roadmap/login.html';
    let signingOut = false;

    function applyAuthState(isSignedIn) {
        if (isSignedIn) {
            authLink.textContent = 'Sign Out';
            authLink.setAttribute('href', '#sign-out');
            authLink.dataset.authState = 'signed-in';
            authLink.setAttribute('aria-label', 'Sign out of Sage-Code account');
        } else {
            authLink.textContent = 'Sign In';
            authLink.setAttribute('href', loginHref);
            authLink.dataset.authState = 'signed-out';
            authLink.setAttribute('aria-label', 'Sign in to Sage-Code account');
        }
    }

    if (authLink.dataset.navAuthWired !== 'true') {
        authLink.dataset.navAuthWired = 'true';
        authLink.addEventListener('click', async function (event) {
            if (authLink.dataset.authState !== 'signed-in') {
                return;
            }
            event.preventDefault();
            if (signingOut) return;
            signingOut = true;
            try {
                if (window.roadmapState && typeof window.roadmapState.signOut === 'function') {
                    await window.roadmapState.signOut();
                    return;
                }
                if (window.sclApi && window.sclApi.auth && typeof window.sclApi.auth.logout === 'function') {
                    await window.sclApi.auth.logout();
                } else {
                    await fetch('/api/auth/logout/', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                        body: '{}'
                    });
                }
                applyAuthState(false);
                window.location.reload();
            } catch (e) {
                signingOut = false;
            }
        });
    }

    window.addEventListener('roadmap-auth-changed', function (event) {
        const registered = Boolean(event && event.detail && event.detail.registered);
        applyAuthState(registered);
    });

    if (window.roadmapState && typeof window.roadmapState.isRegistered === 'function') {
        applyAuthState(window.roadmapState.isRegistered());
        return;
    }

    fetch('/api/auth/session/', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
    })
        .then(function (response) {
            if (!response.ok) return null;
            return response.json();
        })
        .then(function (payload) {
            const user = payload && payload.user ? payload.user : null;
            applyAuthState(Boolean(user && !user.is_anonymous));
        })
        .catch(function () {
            applyAuthState(false);
        });
}

/**
 * Generates the breadcrumb path automatically
 * Fixed for cross-domain support between sagecode.org and savecode.vip
 */
function generateBreadcrumbs() {
    try {
        const MAIN_HUB = getSiteRoot();
        const VIP_HUB = getSiteRoot();
        const isVIP = window.location.hostname.includes('vip.sagecode.org');
        
        const path = window.location.pathname;
        const pathArray = path
            .split('/')
            .filter(p => p && !p.includes("index.html") && p !== 'public');
        const searchParams = new URLSearchParams(window.location.search);
        const quizTrack = searchParams.get('track');
        const quizLevel = (searchParams.get('level') || '').toUpperCase();
        const isQuizCatalogRoute = pathArray[0] === 'roadmap' && pathArray[1] === 'quizzes.html';
        const isQuizPlayerRoute = pathArray[0] === 'roadmap' && pathArray[1] === 'quiz.html';
        const hasValidQuizTrack = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(quizTrack || '');
        if ((isQuizCatalogRoute || isQuizPlayerRoute) && hasValidQuizTrack) {
            if (isQuizPlayerRoute) {
                pathArray.splice(1, 1, quizTrack, 'quizzes.html', /^[ABC]$/.test(quizLevel) ? `${quizLevel} TEST` : 'QUIZ');
            } else {
                pathArray.splice(1, 0, quizTrack);
            }
        }
        
        // 1. Permanent Home Link
        let html = `<a href="${MAIN_HUB}"><i class="bi bi-house-door"></i> HOME</a>`;
        
        // 2. Inject Virtual Path for VIP pages
        if (isVIP) {
            // Community link points to .pro
            html += ` <span class="sep">/</span> <a href="${MAIN_HUB}/community/">COMMUNITY</a>`;
            // Verified contributor hub link points to the root of .vip (since /vip folder doesn't exist on .pro)
            html += ` <span class="sep">/</span> <a href="${VIP_HUB}">VERIFIED CONTRIBUTOR</a>`;
        }

        // 3. Process current site's segments
        let currentPath = isVIP ? VIP_HUB : MAIN_HUB; 

        pathArray.forEach((segment, index) => {
            // Remove extension and format text
            let name = segment.replace('.html', '').replace(/-/g, ' ').toUpperCase();
            const normalizedSegment = segment.toLowerCase();
            const isRoadmapSegment = normalizedSegment === 'roadmap' || normalizedSegment === 'roadmap.html';
            
            // Special handling for topic.html - extract topic parameter
            const isTopicPage = segment.includes('topic.html') || segment === 'topic';
            let topicId = null;
            if (isTopicPage) {
                const params = new URLSearchParams(window.location.search);
                topicId = params.get('topic');
                if (topicId) {
                    name = topicId.replace(/-/g, ' ').toUpperCase();
                }
            }
            
            // Build the URL based on which domain we are currently on
            currentPath += `/${segment}`;
            
            html += ` <span class="sep">/</span> `;
            
            if (index === pathArray.length - 1) {
                if (isRoadmapSegment) {
                    html += `<a href="${MAIN_HUB}/roadmap/">ROADMAP</a>`;
                    return;
                }
                if (isQuizPlayerRoute && hasValidQuizTrack && normalizedSegment === 'quizzes.html') {
                    html += `<a href="${MAIN_HUB}/roadmap/quizzes.html?track=${encodeURIComponent(quizTrack)}">QUIZZES</a>`;
                    return;
                }

                // If on topic.html, make the topic name clickable to reload the page
                if (isTopicPage && topicId) {
                    const topicUrl = `${currentPath}?topic=${topicId}`;
                    html += `<a href="${topicUrl}">${name}</a>`;
                } else {
                    html += `<span class="current">${name}</span>`;
                }
            } else {
                if (isRoadmapSegment) {
                    html += `<a href="${MAIN_HUB}/roadmap/">ROADMAP</a>`;
                    return;
                }
                if (isQuizPlayerRoute && hasValidQuizTrack && normalizedSegment === 'quizzes.html') {
                    html += `<a href="${MAIN_HUB}/roadmap/quizzes.html?track=${encodeURIComponent(quizTrack)}">QUIZZES</a>`;
                    return;
                }

                html += `<a href="${currentPath}">${name}</a>`;
            }
        });

        return html;
    } catch (e) {
        console.error("Breadcrumb error:", e);
        return `<a href="/"><i class="bi bi-house-door"></i> HOME</a>`;
    }
}

function wireHomeLogoTypewriterTrigger() {
    const logoLinks = document.querySelectorAll('a[aria-label="Sage-Code home"]');
    logoLinks.forEach((link) => {
        if (link.dataset.typewriterReplayWired === "true") {
            return;
        }

        link.dataset.typewriterReplayWired = "true";
        link.addEventListener("click", function () {
            try {
                window.sessionStorage.setItem("sage.hero.typewriter.replay", "1");
            } catch (e) {
                // Ignore storage failures in private browsing or restricted environments.
            }
        });
    });
}

function initHeroVisibilityToggle() {
    const toggleButton = document.getElementById("hero-visibility-toggle");
    if (!toggleButton) {
        return;
    }

    const heroSection = document.querySelector(".hero-blackboard");
    if (!heroSection) {
        toggleButton.disabled = true;
        toggleButton.setAttribute("aria-disabled", "true");
        toggleButton.setAttribute("aria-expanded", "false");
        toggleButton.setAttribute("aria-label", "Hero section is not available on this page");
        toggleButton.title = "Hero section is not available on this page";
        toggleButton.innerHTML = HERO_CARET_DOWN_SVG;
        return;
    }

    toggleButton.disabled = false;
    toggleButton.setAttribute("aria-disabled", "false");

    if (!heroSection.id) {
        heroSection.id = "sage-hero-section";
    }

    toggleButton.setAttribute("aria-controls", heroSection.id);

    const pagePath = window.location.pathname || "/";
    const pageQuery = window.location.search || "";
    const storageKey = `sage.hero.visible:${pagePath}${pageQuery}`;
    const defaultCollapsed = heroSection.getAttribute("data-hero-default") === "collapsed";
    let heroVisible = !defaultCollapsed;

    try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved === "0") {
            heroVisible = false;
        } else if (saved === "1") {
            heroVisible = true;
        }
    } catch (e) {
        heroVisible = !defaultCollapsed;
    }

    function applyState(visible) {
        heroVisible = !!visible;
        heroSection.classList.toggle("is-collapsed", !heroVisible);
        toggleButton.setAttribute("aria-expanded", heroVisible ? "true" : "false");
        toggleButton.setAttribute("aria-label", heroVisible ? "Hide hero section" : "Show hero section");
        toggleButton.title = heroVisible ? "Hide hero section" : "Show hero section";
        toggleButton.innerHTML = heroVisible
            ? HERO_CARET_UP_SVG
            : HERO_CARET_DOWN_SVG;
    }

    applyState(heroVisible);

    toggleButton.addEventListener("click", function () {
        applyState(!heroVisible);
        try {
            window.localStorage.setItem(storageKey, heroVisible ? "1" : "0");
        } catch (e) {
            /* Ignore storage failures in restricted environments. */
        }
    });
}