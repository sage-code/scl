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
    this.navStateStoragePrefix = 'sage_nav_state';
    this.lastReadStoragePrefix = 'sage_last_read';
    this._navIdCounter = 0;
    this._lastVisibleSectionId = '';
    this._lastSavedSectionId = '';
    this._lastSavedCollapsedSignature = '';
    this._persistTimer = null;
    this._observer = null;
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
    const bookmarkList = document.getElementById('bookmark-list');
    if (bookmarkList && bookmarkList.dataset.staticSidebar === 'true' && bookmarkList.children.length > 0) {
      this.normalizeSidebarTree(bookmarkList);
      this.decorateSidebarTree(bookmarkList);
      this.removeSidebarChrome();
      this.ensureReturnToRoadmapLink(bookmarkList);
      return;
    }

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
      bookmarkList.innerHTML = '';

      this._navIdCounter = 0;
      this.renderNavItems(navItems, bookmarkList, 0, 'root');
      this.decorateSidebarTree(bookmarkList);
      this.removeSidebarChrome();
      this.ensureReturnToRoadmapLink(bookmarkList);
      
    } catch (error) {
      console.error('Error loading sidebar:', error);
      if (bookmarkList && bookmarkList.children.length === 0) {
        bookmarkList.innerHTML = '<li class="text-danger">Error loading navigation</li>';
      }
    }
  }

  /**
   * Render navigation items recursively
   */
  renderNavItems(items, container, level = 0, path = 'root') {
    items.forEach((item, index) => {
      const isAnchorLink = item.link && item.link.startsWith('#');
      const hasChildren = item.children && Array.isArray(item.children) && item.children.length > 0;
      const nodePath = `${path}-${index + 1}`;
      const sectionKey = isAnchorLink ? item.link.slice(1) : `node-${nodePath}`;
      const nodeId = `node-${sectionKey.replace(/[^a-zA-Z0-9_-]/g, '_')}-${nodePath}`;

      // Skip utility nodes (Back, Next, Learning Topics labels) and keep only actual tree entries.
      if (!isAnchorLink) {
        if (hasChildren) {
          this.renderNavItems(item.children, container, level, nodePath);
        }
        return;
      }

      const li = document.createElement('li');
      li.className = 'nav-item mb-2 nav-tree-item';
      li.dataset.nodeId = nodeId;
      li.dataset.sectionKey = sectionKey;
      if (hasChildren) {
        li.dataset.hasChildren = 'true';
      }

      const row = document.createElement('div');
      row.className = 'nav-node-row';
      row.dataset.nodeId = nodeId;

      const progressControl = document.createElement('input');
      progressControl.type = 'checkbox';
      progressControl.className = 'nav-progress-checkbox';
      progressControl.tabIndex = -1;
      progressControl.setAttribute('aria-hidden', 'true');
      progressControl.dataset.isTrackable = 'true';
      progressControl.dataset.link = item.link;
      progressControl.dataset.sectionKey = sectionKey;
      this._navIdCounter += 1;
      progressControl.id = `nav-${this.topicId}-${this._navIdCounter}`;

      if (hasChildren) {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'nav-tree-toggle';
        toggle.dataset.nodeId = nodeId;
        toggle.setAttribute('aria-label', 'Expand topic folder');
        toggle.setAttribute('aria-expanded', 'false');

        const icon = document.createElement('i');
        icon.className = 'bi bi-folder2';
        icon.setAttribute('aria-hidden', 'true');

        toggle.appendChild(icon);
        row.appendChild(toggle);
      } else {
        const fileIcon = document.createElement('span');
        fileIcon.className = 'nav-file-icon';
        fileIcon.innerHTML = '<i class="bi bi-file-earmark-text"></i>';
        row.appendChild(fileIcon);
      }

      const link = document.createElement('a');
      link.href = item.link;
      link.className = 'nav-tree-link text-decoration-none';
      link.textContent = item.title;
      link.dataset.sectionKey = sectionKey;

      row.appendChild(progressControl);
      row.appendChild(link);
      li.appendChild(row);

      link.addEventListener('click', () => {
        if (!progressControl.checked) {
          progressControl.checked = true;
          progressControl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      if (hasChildren) {
        const nestedUl = document.createElement('ul');
        nestedUl.className = 'list-unstyled mt-1 nav-tree-children is-collapsed';
        nestedUl.dataset.parentNodeId = nodeId;
        this.renderNavItems(item.children, nestedUl, level + 1, nodePath);
        li.appendChild(nestedUl);
      }

      container.appendChild(li);
    });
  }

  normalizeSidebarTree(bookmarkList) {
    if (!bookmarkList) return;

    // Remove decorative separators inserted by older renderers.
    bookmarkList.querySelectorAll('div').forEach((node) => {
      if ((node.textContent || '').replace(/\s/g, '') === '•••') {
        node.remove();
      }
    });

    // Keep only anchor-based entries and nested lists.
    bookmarkList.querySelectorAll('li').forEach((li) => {
      const link = li.querySelector('a[href^="#"]');
      if (!link && !li.classList.contains('return-roadmap-link')) {
        li.remove();
      }
    });
  }

  decorateSidebarTree(bookmarkList) {
    if (!bookmarkList) return;

    const allItems = Array.from(bookmarkList.querySelectorAll('li')).filter((li) => !li.classList.contains('return-roadmap-link'));

    allItems.forEach((li, index) => {
      li.classList.add('nav-tree-item');
      if (!li.dataset.nodeId) {
        li.dataset.nodeId = `static-${index + 1}`;
      }

      let row = li.querySelector(':scope > .nav-node-row');
      const directLink = li.querySelector(':scope > a[href^="#"]') || (row ? row.querySelector('a[href^="#"]') : null);
      if (!row && directLink) {
        row = document.createElement('div');
        row.className = 'nav-node-row';
        li.insertBefore(row, li.firstChild);
        row.appendChild(directLink);
      }

      if (!row || !directLink) {
        return;
      }

      const sectionKey = directLink.getAttribute('href').replace(/^#/, '');
      li.dataset.sectionKey = sectionKey;

      let hiddenProgress = row.querySelector('input[data-is-trackable="true"]');
      if (!hiddenProgress) {
        hiddenProgress = document.createElement('input');
        hiddenProgress.type = 'checkbox';
        hiddenProgress.dataset.isTrackable = 'true';
        hiddenProgress.dataset.link = `#${sectionKey}`;
        hiddenProgress.dataset.sectionKey = sectionKey;
        hiddenProgress.className = 'nav-progress-checkbox';
        row.insertBefore(hiddenProgress, row.firstChild);
      } else {
        hiddenProgress.classList.add('nav-progress-checkbox');
      }

      const childList = li.querySelector(':scope > ul');
      if (childList) {
        li.dataset.hasChildren = 'true';
        childList.classList.add('nav-tree-children');
        if (!childList.classList.contains('is-collapsed')) {
          childList.classList.add('is-collapsed');
        }

        let toggle = row.querySelector('.nav-tree-toggle');
        if (!toggle) {
          toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'nav-tree-toggle';
          toggle.dataset.nodeId = li.dataset.nodeId;
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Expand topic folder');
          toggle.innerHTML = '<i class="bi bi-folder2" aria-hidden="true"></i>';
          row.insertBefore(toggle, row.firstChild);
        }
      } else {
        let fileIcon = row.querySelector('.nav-file-icon');
        if (!fileIcon) {
          fileIcon = document.createElement('span');
          fileIcon.className = 'nav-file-icon';
          fileIcon.innerHTML = '<i class="bi bi-file-earmark-text"></i>';
          row.insertBefore(fileIcon, row.firstChild);
        }
      }

      if (!directLink.classList.contains('nav-tree-link')) {
        directLink.classList.add('nav-tree-link');
      }

      directLink.addEventListener('click', () => {
        if (!hiddenProgress.checked) {
          hiddenProgress.checked = true;
          hiddenProgress.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    this.bindTreeEvents(bookmarkList);
  }

  bindTreeEvents(bookmarkList) {
    if (!bookmarkList || bookmarkList.dataset.treeEventsBound === 'true') return;
    bookmarkList.dataset.treeEventsBound = 'true';

    bookmarkList.addEventListener('click', (event) => {
      const toggle = event.target.closest('.nav-tree-toggle');
      if (!toggle) {
        return;
      }

      event.preventDefault();
      const nodeId = toggle.dataset.nodeId;
      if (!nodeId) {
        return;
      }

      this.toggleNode(nodeId);
      this.schedulePersistNavigationState();
    });
  }

  toggleNode(nodeId, forceExpanded) {
    const row = document.querySelector(`.nav-node-row[data-node-id="${nodeId}"]`);
    const children = document.querySelector(`.nav-tree-children[data-parent-node-id="${nodeId}"]`) ||
      row?.parentElement?.querySelector(':scope > .nav-tree-children');
    const toggle = row ? row.querySelector('.nav-tree-toggle') : null;

    if (!children || !toggle) {
      return;
    }

    const isCollapsed = children.classList.contains('is-collapsed');
    const nextExpanded = typeof forceExpanded === 'boolean' ? forceExpanded : isCollapsed;

    children.classList.toggle('is-collapsed', !nextExpanded);
    toggle.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
    toggle.setAttribute('aria-label', nextExpanded ? 'Collapse topic folder' : 'Expand topic folder');

    const icon = toggle.querySelector('i');
    if (icon) {
      icon.className = nextExpanded ? 'bi bi-folder2-open' : 'bi bi-folder2';
    }
  }

  getCourseId() {
    if (this.roadmapCourseId) {
      return this.roadmapCourseId;
    }

    if (window.sageCourseIdForLab) {
      return window.sageCourseIdForLab(this.labId, this.roadmapCourseId);
    }

    return this.labId;
  }

  getLocalNavStateKey() {
    const sync = window.sageRoadmapProgressSync;
    if (sync && typeof sync.navStateStorageKey === 'function') {
      return sync.navStateStorageKey(this.labId, this.topicId);
    }

    return `${this.navStateStoragePrefix}-${this.labId}-${this.topicId}`;
  }

  getLocalLastReadKey() {
    const sync = window.sageRoadmapProgressSync;
    if (sync && typeof sync.lastReadStorageKey === 'function') {
      return sync.lastReadStorageKey(this.labId, this.topicId);
    }

    return `${this.lastReadStoragePrefix}-${this.labId}-${this.topicId}`;
  }

  getCollapsedNodeIds() {
    return Array.from(document.querySelectorAll('#bookmark-list .nav-tree-item[data-has-children="true"]'))
      .filter((li) => {
        const child = li.querySelector(':scope > .nav-tree-children');
        return child && child.classList.contains('is-collapsed');
      })
      .map((li) => li.dataset.nodeId)
      .filter(Boolean);
  }

  getNavigationStateSnapshot() {
    return {
      collapsedNodeIds: this.getCollapsedNodeIds(),
      lastReadSectionId: this._lastVisibleSectionId || ''
    };
  }

  saveLocalNavigationState(state) {
    localStorage.setItem(this.getLocalNavStateKey(), JSON.stringify({
      collapsedNodeIds: state.collapsedNodeIds || []
    }));

    if (state.lastReadSectionId) {
      localStorage.setItem(this.getLocalLastReadKey(), state.lastReadSectionId);
    }
  }

  async syncNavigationStateToRemote(state) {
    const sync = window.sageRoadmapProgressSync;
    if (!sync || !window.roadmapState || typeof window.roadmapState.getUser !== 'function' || !window.roadmapState.getUser()) {
      return;
    }

    const collapsedNodeIds = state.collapsedNodeIds || [];
    const collapsedSignature = collapsedNodeIds.join('|');
    if (collapsedSignature !== this._lastSavedCollapsedSignature && typeof sync.saveCollapsedNodes === 'function') {
      await sync.saveCollapsedNodes(this.getCourseId(), this.topicId, collapsedNodeIds);
      this._lastSavedCollapsedSignature = collapsedSignature;
    }

    if (state.lastReadSectionId && state.lastReadSectionId !== this._lastSavedSectionId && typeof sync.saveLastReadPosition === 'function') {
      await sync.saveLastReadPosition(this.getCourseId(), this.topicId, state.lastReadSectionId);
      this._lastSavedSectionId = state.lastReadSectionId;
    }
  }

  schedulePersistNavigationState() {
    if (this._persistTimer) {
      clearTimeout(this._persistTimer);
    }

    this._persistTimer = setTimeout(() => {
      this.persistNavigationState();
    }, 350);
  }

  async persistNavigationState() {
    const snapshot = this.getNavigationStateSnapshot();
    this.saveLocalNavigationState(snapshot);

    try {
      await this.syncNavigationStateToRemote(snapshot);
    } catch (error) {
      console.warn('Unable to synchronize topic navigation state:', error);
    }
  }

  applyCollapsedNodeState(collapsedNodeIds) {
    const collapsedSet = new Set(Array.isArray(collapsedNodeIds) ? collapsedNodeIds : []);

    document.querySelectorAll('#bookmark-list .nav-tree-item[data-has-children="true"]').forEach((li) => {
      const nodeId = li.dataset.nodeId;
      if (!nodeId) {
        return;
      }

      this.toggleNode(nodeId, !collapsedSet.has(nodeId));
    });
  }

  scrollToLastReadSection(sectionId) {
    if (!sectionId) {
      return;
    }

    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
  }

  async restoreNavigationState() {
    let localCollapsed = [];
    let localLastRead = '';
    try {
      const local = JSON.parse(localStorage.getItem(this.getLocalNavStateKey()) || '{}');
      localCollapsed = Array.isArray(local.collapsedNodeIds) ? local.collapsedNodeIds : [];
      localLastRead = localStorage.getItem(this.getLocalLastReadKey()) || '';
    } catch {
      localCollapsed = [];
      localLastRead = '';
    }

    this.applyCollapsedNodeState(localCollapsed);
    if (localLastRead) {
      this._lastVisibleSectionId = localLastRead;
      this.scrollToLastReadSection(localLastRead);
    }

    const sync = window.sageRoadmapProgressSync;
    if (!sync || !window.roadmapState || typeof window.roadmapState.getUser !== 'function' || !window.roadmapState.getUser()) {
      return;
    }

    try {
      if (typeof sync.loadCollapsedNodes === 'function') {
        const remoteCollapsed = await sync.loadCollapsedNodes(this.getCourseId(), this.topicId);
        if (Array.isArray(remoteCollapsed) && remoteCollapsed.length > 0) {
          this.applyCollapsedNodeState(remoteCollapsed);
        }
      }

      if (typeof sync.loadLastReadPosition === 'function') {
        const remoteLastRead = await sync.loadLastReadPosition(this.getCourseId(), this.topicId);
        if (remoteLastRead) {
          this._lastVisibleSectionId = remoteLastRead;
          this.scrollToLastReadSection(remoteLastRead);
        }
      }
    } catch (error) {
      console.warn('Unable to restore remote topic navigation state:', error);
    }
  }

  startLastReadTracking() {
    const headings = Array.from(document.querySelectorAll('#main-content [id]')).filter((el) => {
      const id = el.getAttribute('id');
      return !!id;
    });

    if (headings.length === 0) {
      return;
    }

    if ('IntersectionObserver' in window) {
      this._observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length === 0) {
          return;
        }

        const nextId = visible[0].target.getAttribute('id');
        if (!nextId || nextId === this._lastVisibleSectionId) {
          return;
        }

        this._lastVisibleSectionId = nextId;
        this.schedulePersistNavigationState();
      }, {
        root: null,
        threshold: 0.55,
        rootMargin: '-80px 0px -45% 0px'
      });

      headings.forEach((heading) => {
        this._observer.observe(heading);
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.persistNavigationState();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.persistNavigationState();
    });
  }

  removeSidebarChrome() {
    const homeLink = document.getElementById('home-link');
    if (homeLink) {
      homeLink.remove();
    }

    const progressWrap = document.querySelector('#study-sidebar .progress') || document.querySelector('.sidebar-content .progress');
    if (progressWrap) {
      progressWrap.remove();
    }
  }

  ensureReturnToRoadmapLink(list) {
    if (!list || list.querySelector('.return-roadmap-link')) return;
    const returnItem = document.createElement('li');
    returnItem.className = 'nav-item mb-2 return-roadmap-link';
    returnItem.innerHTML = `<a href="${this.labHomeLink}" class="text-info text-decoration-none">Return to Roadmap</a>`;
    list.appendChild(returnItem);
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
          <p><a href="./index.html"><i class="bi bi-arrow-left-square-fill me-1" aria-hidden="true"></i>Back to Laboratory</a></p>
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
    if (typeof window.initializeProgressTracking === 'function') {
      window.initializeProgressTracking({
        labId: this.labId,
        topicId: this.topicId,
        roadmapCourseId: this.roadmapCourseId,
        checkboxSelector: '#bookmark-list input[data-is-trackable="true"]'
      });
    }
    await this.restoreNavigationState();
    this.startLastReadTracking();
    window.addEventListener('roadmap-auth-changed', () => {
      this.restoreNavigationState();
      this.schedulePersistNavigationState();
    });
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
