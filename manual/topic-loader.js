/**
 * Topic Loader — fills the sidebar from ./{topicId}.json, optional main fetch.
 * With TOPIC_CONFIG.inlineContent = true, article HTML stays in #main-content (no fetch).
 * Header is rendered by /sage.js into #dynamic-header.
 */

class TopicLoader {
  constructor(config = {}) {
    this.labId = config.labId || 'default';
    this.topicId =
      config.topicId !== undefined && config.topicId !== null && String(config.topicId).length
        ? config.topicId
        : this.getTopicFromUrl();
    this.homeLink = config.homeLink || './index.html#topics';
    this.labHomeLink = config.labHomeLink || './index.html';
    /** When true, main article HTML is already in the page; do not fetch a fragment. */
    this.inlineContent = !!config.inlineContent;
    /** Maps to roadmap table data-sage-roadmap (e.g. cse-main, go). */
    this.roadmapCourseId = config.roadmapCourseId;
  }

  /**
   * Get topic ID from URL parameter
   */
  getTopicFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('topic') || 'overview';
  }

  /**
   * Format topic name for display
   */
  formatTopicName(topicId) {
    return topicId.charAt(0).toUpperCase() + topicId.replace(/-/g, ' ').slice(1);
  }

  /**
   * Load and render sidebar from JSON
   */
  async loadSidebar() {
    try {
      // Build the correct path accounting for Vercel's cleanUrls and trailingSlash
      // On Vercel: /engineering/concepts/ (no .html, with trailing slash)
      // On local: /engineering/concepts.html (with .html extension)
      let basePath = window.location.pathname;
      
      // Remove trailing slash (added by trailingSlash: true on Vercel)
      if (basePath.endsWith('/')) {
        basePath = basePath.slice(0, -1);
      }
      
      // Remove .html extension if present (removed by cleanUrls on Vercel)
      if (basePath.endsWith('.html')) {
        basePath = basePath.slice(0, -5);
      }
      
      const jsonFile = `${basePath}.json`;
      
      const response = await fetch(jsonFile);
      if (!response.ok) throw new Error(`Failed to load ${jsonFile} (status: ${response.status})`);
      
      const navItems = await response.json();
      const bookmarkList = document.getElementById('bookmark-list');
      bookmarkList.innerHTML = '';

      this._navIdCounter = 0;
      this.renderNavItems(navItems, bookmarkList);
      this.initializeProgressTracking();
      
    } catch (error) {
      console.error('Error loading sidebar:', error);
      const bookmarkList = document.getElementById('bookmark-list');
      bookmarkList.innerHTML = '<li class="text-danger">Error loading navigation</li>';
    }
  }

  /**
   * Render navigation items recursively
   */
  renderNavItems(items, container, level = 0) {
    items.forEach((item, index) => {
      const isAnchorLink = item.link && item.link.startsWith('#');
      const isBackItem = item.title && (item.title.startsWith('Back') || item.title.includes('back'));
      const isNavButton = item.title && item.title.startsWith('Next:');
      const isBookmark = item.title && item.title.includes('Learning Topics');

      // Add separator before special items
      if (isBookmark || isNavButton || isBackItem) {
        const dotSeparator = document.createElement('div');
        dotSeparator.style.textAlign = 'center';
        dotSeparator.style.margin = '1rem 0 0.5rem 0';
        dotSeparator.style.color = 'rgba(13, 110, 253, 0.5)';
        dotSeparator.style.fontSize = '1.2rem';
        dotSeparator.style.letterSpacing = '0.3rem';
        dotSeparator.textContent = '• • •';
        container.appendChild(dotSeparator);
      }

      const li = document.createElement('li');
      li.className = 'nav-item mb-2';

      if (isAnchorLink) {
        // Checkbox for anchor links
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input me-2';
        this._navIdCounter += 1;
        checkbox.id = `nav-${this.topicId}-${this._navIdCounter}`;
        checkbox.dataset.isTrackable = 'true';
        checkbox.dataset.link = item.link;
        checkbox.dataset.sectionKey = item.link.slice(1);

        const link = document.createElement('a');
        link.href = item.link;
        link.className = 'text-info text-decoration-none';
        link.textContent = item.title;

        li.appendChild(checkbox);
        li.appendChild(link);
      } else {
        // Navigation links
        const link = document.createElement('a');
        link.href = item.link || (item.target ? `./${item.target}.html` : '#');
        link.className = isNavButton || isBackItem ? 'fw-bold text-warning text-decoration-none' : 
                         isBookmark ? 'fw-bold text-success text-decoration-none' : 
                         'text-info text-decoration-none';
        
        if (isBackItem) {
          link.innerHTML = '◄ ' + item.title;
        } else if (isNavButton) {
          link.innerHTML = '❯ ' + item.title;
        } else {
          link.textContent = item.title;
        }

        li.appendChild(link);
      }

      container.appendChild(li);

      if (item.children && Array.isArray(item.children)) {
        const nestedUl = document.createElement('ul');
        nestedUl.className = 'list-unstyled ms-4 mt-1';
        container.appendChild(nestedUl);
        this.renderNavItems(item.children, nestedUl, level + 1);
      }
    });
  }

  /**
   * Load content HTML file
   */
  async loadContent() {
    try {
      // Build the correct path accounting for Vercel's cleanUrls and trailingSlash
      // On Vercel: /engineering/concepts/ (no .html, with trailing slash)
      // On local: /engineering/concepts.html (with .html extension)
      let basePath = window.location.pathname;
      
      // Remove trailing slash (added by trailingSlash: true on Vercel)
      if (basePath.endsWith('/')) {
        basePath = basePath.slice(0, -1);
      }
      
      // Remove .html extension if present (removed by cleanUrls on Vercel)
      if (basePath.endsWith('.html')) {
        basePath = basePath.slice(0, -5);
      }
      
      const contentFile = `${basePath}.html`;
      
      const response = await fetch(contentFile);
      if (!response.ok) throw new Error(`Failed to load ${contentFile}`);
      
      const html = await response.text();
      const mainContent = document.getElementById('main-content');
      mainContent.innerHTML = html;
      
      // Re-highlight code blocks
      if (window.Prism) {
        Prism.highlightAllUnder(mainContent);
      }
      
    } catch (error) {
      console.error('Error loading content:', error);
      const mainContent = document.getElementById('main-content');
      mainContent.innerHTML = `
        <div class="alert alert-warning">
          <h4>Content Not Found</h4>
          <p>Unable to load topic content</p>
          <p><a href="./index.html">← Back to Laboratory</a></p>
        </div>
      `;
    }
  }

  /**
   * Update breadcrumb and title
   */
  updatePageMetadata() {
    const topicName = this.formatTopicName(this.topicId);
    document.title = `${topicName} - ${this.labId.charAt(0).toUpperCase() + this.labId.slice(1)}`;
    
    const breadcrumb = document.getElementById('current-topic');
    if (breadcrumb) {
      breadcrumb.textContent = topicName;
    }

    // Update home link to point to #topics
    const homeLink = document.getElementById('home-link');
    if (homeLink) {
      homeLink.href = this.homeLink;
    }
  }

  /**
   * Initialize progress tracking (auto-handled by /common/progress.js)
   */
  initializeProgressTracking() {
    // Explicitly initialize progress tracking with the correct context
    if (window.initializeProgressTracking) {
      window.initializeProgressTracking({
        labId: this.labId,
        topicId: this.topicId,
        roadmapCourseId: this.roadmapCourseId
      });
    }
  }

  /**
   * Initialize mobile toggle
   */
  initializeMobileToggle() {
    const openBtn = document.getElementById('open-sidebar');
    const sidebar = document.querySelector('.side-bar');
    const mainContent = document.getElementById('main-content');
    
    if (!openBtn || !sidebar) return;
    
    openBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
    
    const links = sidebar.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('active');
      });
    });
    
    mainContent.addEventListener('click', () => {
      sidebar.classList.remove('active');
    });
  }

  /**
   * Initialize loader - call from document.DOMContentLoaded
   */
  async init() {
    this.updatePageMetadata();
    await this.loadSidebar();
    if (!this.inlineContent) {
      await this.loadContent();
    } else {
      const mainContent = document.getElementById('main-content');
      if (mainContent && window.Prism) {
        Prism.highlightAllUnder(mainContent);
      }
    }
    this.initializeMobileToggle();
    if (window.sageStartTopicReadTracking) {
      window.sageStartTopicReadTracking({
        labId: this.labId,
        topicId: this.topicId,
        roadmapCourseId: this.roadmapCourseId
      });
    }
  }
}

// Auto-initialize if TOPIC_CONFIG is defined
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.TOPIC_CONFIG !== 'undefined') {
    const loader = new TopicLoader(window.TOPIC_CONFIG);
    await loader.init();
  }
});
