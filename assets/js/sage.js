/**
 * sage.js - Global Logic for sagecode.org
 * Handles the Dynamic Header and Alignment
 */

document.addEventListener("DOMContentLoaded", function () {
    normalizeRoadmapTrackRootPath();
    normalizeLocalPublicLinks();
    initDynamicHeader();
    wireHomeLogoTypewriterTrigger();
});

function normalizeRoadmapTrackRootPath() {
    const path = window.location.pathname || '/';
    const match = path.match(/^\/(public\/)?roadmap\/(cse|csp|dsa|dba|tek|sml|hpc|dsl|osd)$/i);
    if (!match) return;

    const normalizedPath = `${path}/`;
    const suffix = `${window.location.search || ''}${window.location.hash || ''}`;
    window.location.replace(`${normalizedPath}${suffix}`);
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
                        <li><a href="/projects/">Project</a></li>
                        <li><a href="/community/">Community</a></li>
                    </ul>
                </nav>
            </div>
        </div>
        
        <div class="row g-0 mt-0 p-0">
            <div class="col ps-0">
                <nav class="breadcrumb-nav">${generateBreadcrumbs()}</nav>
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
        
        // 1. Permanent Home Link
        let html = `<a href="${MAIN_HUB}"><i class="bi bi-house-door"></i> HOME</a>`;
        
        // 2. Inject Virtual Path for VIP pages
        if (isVIP) {
            // Community link points to .pro
            html += ` <span class="sep">/</span> <a href="${MAIN_HUB}/community/">COMMUNITY</a>`;
            // VIP link points to the root of .vip (since /vip folder doesn't exist on .pro)
            html += ` <span class="sep">/</span> <a href="${VIP_HUB}">VIP</a>`;
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