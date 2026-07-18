/**
 * Topic Loader — fills the sidebar from ./{topicId}.json, optional main fetch,
 * then upgrades the result into a real tree navigator bound to page headings.
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
    this.inlineContent = !!config.inlineContent;
    this.roadmapCourseId = config.roadmapCourseId;
    this.navStateStoragePrefix = 'sage_nav_state';
    this.lastReadStoragePrefix = 'sage_last_read';
    this.bookmarkList = null;
    this.treeNodes = [];
    this.treeNodesById = new Map();
    this.treeNodesBySection = new Map();
    this.activeSectionId = '';
    this._navIdCounter = 0;
    this._lastVisibleSectionId = '';
    this._lastSavedSectionId = '';
    this._lastSavedCollapsedSignature = '';
    this._persistTimer = null;
    this._observer = null;
  }

  getTopicFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('topic') || 'overview';
  }

  formatTopicName(topicId) {
    return topicId.charAt(0).toUpperCase() + topicId.replace(/-/g, ' ').slice(1);
  }

  buildNodeId(sectionKey, path) {
    return `node-${String(sectionKey).replace(/[^a-zA-Z0-9_-]/g, '_')}-${path}`;
  }

  createProgressControl(link, sectionKey) {
    const progressControl = document.createElement('input');
    progressControl.type = 'checkbox';
    progressControl.className = 'nav-progress-checkbox';
    progressControl.tabIndex = -1;
    progressControl.setAttribute('aria-hidden', 'true');
    progressControl.dataset.isTrackable = 'true';
    progressControl.dataset.link = link;
    progressControl.dataset.sectionKey = sectionKey;
    this._navIdCounter += 1;
    progressControl.id = `nav-${this.topicId}-${this._navIdCounter}`;
    return progressControl;
  }

  createToggleButton(nodeId, expanded) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-tree-toggle';
    toggle.dataset.nodeId = nodeId;
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggle.setAttribute('aria-label', expanded ? 'Collapse topic folder' : 'Expand topic folder');
    toggle.innerHTML = `<i class="bi ${expanded ? 'bi-folder2-open' : 'bi-folder2'}" aria-hidden="true"></i>`;
    return toggle;
  }

  createFileIcon() {
    const fileIcon = document.createElement('span');
    fileIcon.className = 'nav-file-icon';
    fileIcon.innerHTML = '<i class="bi bi-file-earmark-text" aria-hidden="true"></i>';
    return fileIcon;
  }

  isTreeLevelExpandedByDefault(level) {
    return level === 0;
  }

  async loadSidebar() {
    const bookmarkList = document.getElementById('bookmark-list');
    this.bookmarkList = bookmarkList;

    if (bookmarkList && bookmarkList.dataset.staticSidebar === 'true' && bookmarkList.children.length > 0) {
      this.normalizeSidebarTree(bookmarkList);
      this.decorateSidebarTree(bookmarkList);
      this.removeSidebarChrome();
      this.ensureReturnToRoadmapLink(bookmarkList);
      return;
    }

    try {
      let basePath = window.location.pathname;
      if (basePath.endsWith('/')) {
        basePath = basePath.slice(0, -1);
      }
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

  renderNavItems(items, container, level = 0, path = 'root') {
    items.forEach((item, index) => {
      const link = item.link || '';
      const isAnchorLink = link.startsWith('#');
      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      const nodePath = `${path}-${index + 1}`;

      if (!isAnchorLink) {
        if (hasChildren) {
          this.renderNavItems(item.children, container, level, nodePath);
        }
        return;
      }

      const sectionKey = link.slice(1);
      const nodeId = this.buildNodeId(sectionKey, nodePath);
      const expanded = hasChildren ? this.isTreeLevelExpandedByDefault(level) : false;

      const li = document.createElement('li');
      li.className = 'nav-item mb-2 nav-tree-item';
      li.dataset.nodeId = nodeId;
      li.dataset.sectionKey = sectionKey;
      li.dataset.treeLevel = String(level);
      if (hasChildren) {
        li.dataset.hasChildren = 'true';
      }

      const row = document.createElement('div');
      row.className = 'nav-node-row';
      row.dataset.nodeId = nodeId;
      row.dataset.sectionKey = sectionKey;

      if (hasChildren) {
        row.appendChild(this.createToggleButton(nodeId, expanded));
      } else {
        row.appendChild(this.createFileIcon());
      }

      row.appendChild(this.createProgressControl(link, sectionKey));

      const navLink = document.createElement('a');
      navLink.href = link;
      navLink.className = 'nav-tree-link text-decoration-none';
      navLink.textContent = item.title || this.formatTopicName(sectionKey);
      navLink.dataset.sectionKey = sectionKey;
      navLink.setAttribute('role', 'treeitem');
      navLink.setAttribute('aria-level', String(level + 1));
      navLink.tabIndex = -1;
      row.appendChild(navLink);
      li.appendChild(row);

      if (hasChildren) {
        const childList = document.createElement('ul');
        childList.className = `list-unstyled mt-1 nav-tree-children${expanded ? '' : ' is-collapsed'}`;
        childList.dataset.parentNodeId = nodeId;
        childList.setAttribute('role', 'group');
        this.renderNavItems(item.children, childList, level + 1, nodePath);
        li.appendChild(childList);
      }

      container.appendChild(li);
    });
  }

  normalizeSidebarTree(bookmarkList) {
    if (!bookmarkList) return;

    bookmarkList.querySelectorAll('div').forEach((node) => {
      if ((node.textContent || '').replace(/\s/g, '') === '•••') {
        node.remove();
      }
    });

    bookmarkList.querySelectorAll('li').forEach((li) => {
      const link = li.querySelector('a[href^="#"]');
      if (!link && !li.classList.contains('return-roadmap-link')) {
        li.remove();
      }
    });
  }

  computeTreeLevel(li) {
    let level = 0;
    let current = li.parentElement;
    while (current && current !== this.bookmarkList) {
      if (current.matches('ul')) {
        level += 1;
      }
      current = current.parentElement;
    }
    return Math.max(0, level);
  }

  decorateSidebarTree(bookmarkList) {
    if (!bookmarkList) return;

    const allItems = Array.from(bookmarkList.querySelectorAll('li')).filter(
      (li) => !li.classList.contains('return-roadmap-link')
    );

    allItems.forEach((li, index) => {
      li.classList.add('nav-tree-item');
      if (!li.dataset.nodeId) {
        const link = li.querySelector(':scope > a[href^="#"], :scope > .nav-node-row a[href^="#"]');
        const sectionKey = link ? link.getAttribute('href').replace(/^#/, '') : `item-${index + 1}`;
        li.dataset.nodeId = this.buildNodeId(sectionKey, `static-${index + 1}`);
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

      const level = Number.parseInt(li.dataset.treeLevel || String(this.computeTreeLevel(li)), 10) || 0;
      const sectionKey = directLink.getAttribute('href').replace(/^#/, '');
      const hasChildren = !!li.querySelector(':scope > ul');
      const expanded = hasChildren ? this.isTreeLevelExpandedByDefault(level) : false;

      li.dataset.sectionKey = sectionKey;
      li.dataset.treeLevel = String(level);
      row.dataset.nodeId = li.dataset.nodeId;
      row.dataset.sectionKey = sectionKey;

      let hiddenProgress = row.querySelector('input[data-is-trackable="true"]');
      if (!hiddenProgress) {
        hiddenProgress = this.createProgressControl(`#${sectionKey}`, sectionKey);
        row.insertBefore(hiddenProgress, row.firstChild);
      } else {
        hiddenProgress.className = 'nav-progress-checkbox';
        hiddenProgress.dataset.link = `#${sectionKey}`;
        hiddenProgress.dataset.sectionKey = sectionKey;
      }

      const childList = li.querySelector(':scope > ul');
      if (childList) {
        li.dataset.hasChildren = 'true';
        childList.classList.add('nav-tree-children');
        childList.dataset.parentNodeId = li.dataset.nodeId;
        childList.setAttribute('role', 'group');
        childList.classList.toggle('is-collapsed', !expanded);

        let toggle = row.querySelector('.nav-tree-toggle');
        if (!toggle) {
          toggle = this.createToggleButton(li.dataset.nodeId, expanded);
          row.insertBefore(toggle, row.firstChild);
        } else {
          toggle.dataset.nodeId = li.dataset.nodeId;
          toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
          toggle.setAttribute('aria-label', expanded ? 'Collapse topic folder' : 'Expand topic folder');
          const icon = toggle.querySelector('i');
          if (icon) {
            icon.className = `bi ${expanded ? 'bi-folder2-open' : 'bi-folder2'}`;
          }
        }
      } else {
        let fileIcon = row.querySelector('.nav-file-icon');
        if (!fileIcon) {
          fileIcon = this.createFileIcon();
          row.insertBefore(fileIcon, row.firstChild);
        }
      }

      directLink.classList.add('nav-tree-link');
      directLink.dataset.sectionKey = sectionKey;
      directLink.setAttribute('role', 'treeitem');
      directLink.setAttribute('aria-level', String(level + 1));
      directLink.tabIndex = -1;
    });

    this.initializeTreeModel(bookmarkList);
    this.bindTreeEvents(bookmarkList);
  }

  initializeTreeModel(bookmarkList) {
    this.bookmarkList = bookmarkList;
    this.bookmarkList.setAttribute('role', 'tree');
    this.treeNodes = [];
    this.treeNodesById.clear();
    this.treeNodesBySection.clear();

    const items = Array.from(bookmarkList.querySelectorAll('.nav-tree-item')).filter(
      (li) => !li.classList.contains('return-roadmap-link')
    );

    items.forEach((li) => {
      const row = li.querySelector(':scope > .nav-node-row');
      const link = row ? row.querySelector('.nav-tree-link') : null;
      if (!row || !link) {
        return;
      }

      const nodeId = li.dataset.nodeId;
      const sectionId = li.dataset.sectionKey || link.dataset.sectionKey || '';
      const level = Number.parseInt(li.dataset.treeLevel || '0', 10) || 0;
      const childList = li.querySelector(':scope > .nav-tree-children');
      const toggle = row.querySelector('.nav-tree-toggle');
      const progressControl = row.querySelector('.nav-progress-checkbox');
      const parentList = li.parentElement;
      const parentNodeId =
        parentList && parentList !== bookmarkList
          ? parentList.dataset.parentNodeId || (parentList.parentElement && parentList.parentElement.dataset.nodeId) || ''
          : '';

      const node = {
        nodeId,
        sectionId,
        level,
        li,
        row,
        link,
        toggle,
        childList,
        progressControl,
        parentNodeId,
        hasChildren: !!childList
      };

      this.treeNodes.push(node);
      this.treeNodesById.set(nodeId, node);
      if (sectionId) {
        this.treeNodesBySection.set(sectionId, node);
      }
    });
  }

  bindTreeEvents(bookmarkList) {
    if (!bookmarkList || bookmarkList.dataset.treeEventsBound === 'true') return;
    bookmarkList.dataset.treeEventsBound = 'true';

    bookmarkList.addEventListener('click', (event) => {
      const toggle = event.target.closest('.nav-tree-toggle');
      if (toggle) {
        event.preventDefault();
        this.toggleNode(toggle.dataset.nodeId);
        this.schedulePersistNavigationState();
        return;
      }

      const link = event.target.closest('.nav-tree-link');
      if (!link) {
        return;
      }

      const sectionId = link.dataset.sectionKey || '';
      this.activateSection(sectionId, { scrollPage: false, focusLink: false, persist: true });
      const node = this.treeNodesBySection.get(sectionId);
      if (node && node.progressControl && !node.progressControl.checked) {
        node.progressControl.checked = true;
        node.progressControl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    bookmarkList.addEventListener('keydown', (event) => {
      const key = event.key;
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(key)) {
        return;
      }

      const currentSectionId = this.getFocusedSectionId() || this.activeSectionId || this.getFirstVisibleSectionId();
      const currentNode = currentSectionId ? this.treeNodesBySection.get(currentSectionId) : null;
      const visibleNodes = this.getVisibleTreeNodes();
      const currentIndex = currentNode ? visibleNodes.findIndex((node) => node.sectionId === currentNode.sectionId) : -1;

      if (key === 'ArrowDown' || key === 'ArrowUp') {
        if (visibleNodes.length === 0) return;
        event.preventDefault();
        const delta = key === 'ArrowDown' ? 1 : -1;
        const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex = Math.min(Math.max(fallbackIndex + delta, 0), visibleNodes.length - 1);
        this.activateSection(visibleNodes[nextIndex].sectionId, {
          scrollPage: true,
          focusLink: true,
          persist: true
        });
        return;
      }

      if (key === 'Home' || key === 'End') {
        if (visibleNodes.length === 0) return;
        event.preventDefault();
        const targetNode = key === 'Home' ? visibleNodes[0] : visibleNodes[visibleNodes.length - 1];
        this.activateSection(targetNode.sectionId, { scrollPage: true, focusLink: true, persist: true });
        return;
      }

      if (!currentNode) {
        return;
      }

      if (key === 'ArrowRight') {
        event.preventDefault();
        if (currentNode.hasChildren && currentNode.childList && currentNode.childList.classList.contains('is-collapsed')) {
          this.toggleNode(currentNode.nodeId, true);
          this.schedulePersistNavigationState();
          return;
        }

        const childNode = this.treeNodes.find((node) => node.parentNodeId === currentNode.nodeId);
        if (childNode) {
          this.activateSection(childNode.sectionId, { scrollPage: true, focusLink: true, persist: true });
        }
        return;
      }

      if (key === 'ArrowLeft') {
        event.preventDefault();
        if (currentNode.hasChildren && currentNode.childList && !currentNode.childList.classList.contains('is-collapsed')) {
          this.toggleNode(currentNode.nodeId, false);
          this.schedulePersistNavigationState();
          return;
        }

        if (currentNode.parentNodeId) {
          const parentNode = this.treeNodesById.get(currentNode.parentNodeId);
          if (parentNode) {
            this.activateSection(parentNode.sectionId, { scrollPage: true, focusLink: true, persist: true });
          }
        }
        return;
      }

      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        this.activateSection(currentNode.sectionId, { scrollPage: true, focusLink: true, persist: true });
      }
    });
  }

  getFocusedSectionId() {
    const active = document.activeElement;
    if (!active || !this.bookmarkList || !this.bookmarkList.contains(active)) {
      return '';
    }

    return active.dataset && active.dataset.sectionKey ? active.dataset.sectionKey : '';
  }

  getFirstVisibleSectionId() {
    const first = this.getVisibleTreeNodes()[0];
    return first ? first.sectionId : '';
  }

  isNodeVisible(node) {
    let parent = node.li.parentElement;
    while (parent && parent !== this.bookmarkList) {
      if (parent.classList.contains('nav-tree-children') && parent.classList.contains('is-collapsed')) {
        return false;
      }
      parent = parent.parentElement;
    }
    return true;
  }

  getVisibleTreeNodes() {
    return this.treeNodes.filter((node) => this.isNodeVisible(node));
  }

  toggleNode(nodeId, forceExpanded) {
    const node = this.treeNodesById.get(nodeId);
    if (!node || !node.childList || !node.toggle) {
      return;
    }

    const currentlyCollapsed = node.childList.classList.contains('is-collapsed');
    const nextExpanded = typeof forceExpanded === 'boolean' ? forceExpanded : currentlyCollapsed;
    node.childList.classList.toggle('is-collapsed', !nextExpanded);
    node.toggle.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
    node.toggle.setAttribute('aria-label', nextExpanded ? 'Collapse topic folder' : 'Expand topic folder');

    const icon = node.toggle.querySelector('i');
    if (icon) {
      icon.className = `bi ${nextExpanded ? 'bi-folder2-open' : 'bi-folder2'}`;
    }

    if (!nextExpanded && this.activeSectionId) {
      const activeNode = this.treeNodesBySection.get(this.activeSectionId);
      let parentNodeId = activeNode ? activeNode.parentNodeId : '';
      while (parentNodeId) {
        if (parentNodeId === nodeId) {
          this.activateSection(node.sectionId, { scrollPage: false, focusLink: false, persist: false });
          break;
        }
        const parentNode = this.treeNodesById.get(parentNodeId);
        parentNodeId = parentNode ? parentNode.parentNodeId : '';
      }
    }
  }

  ensureAncestorsExpanded(node) {
    let parentNodeId = node ? node.parentNodeId : '';
    while (parentNodeId) {
      this.toggleNode(parentNodeId, true);
      const parentNode = this.treeNodesById.get(parentNodeId);
      parentNodeId = parentNode ? parentNode.parentNodeId : '';
    }
  }

  ensureTreeItemVisible(node) {
    if (!node || !node.row) return;
    node.row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  activateSection(sectionId, options = {}) {
    const { scrollPage = false, focusLink = false, persist = false } = options;
    const node = this.treeNodesBySection.get(sectionId);
    if (!node) {
      return;
    }

    this.ensureAncestorsExpanded(node);

    this.treeNodes.forEach((treeNode) => {
      const isActive = treeNode.sectionId === sectionId;
      treeNode.li.classList.toggle('is-active', isActive);
      treeNode.row.classList.toggle('is-active', isActive);
      treeNode.link.classList.toggle('is-active', isActive);
      treeNode.link.tabIndex = isActive ? 0 : -1;
      if (isActive) {
        treeNode.link.setAttribute('aria-current', 'location');
      } else {
        treeNode.link.removeAttribute('aria-current');
      }
    });

    this.activeSectionId = sectionId;
    this._lastVisibleSectionId = sectionId;
    this.ensureTreeItemVisible(node);

    if (focusLink) {
      node.link.focus({ preventScroll: true });
    }

    if (scrollPage) {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ block: 'start', behavior: 'auto' });
      }
    }

    if (persist) {
      this.schedulePersistNavigationState();
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
    return this.treeNodes
      .filter((node) => node.hasChildren && node.childList && node.childList.classList.contains('is-collapsed'))
      .map((node) => node.nodeId)
      .filter(Boolean);
  }

  getNavigationStateSnapshot() {
    return {
      collapsedNodeIds: this.getCollapsedNodeIds(),
      lastReadSectionId: this._lastVisibleSectionId || this.activeSectionId || ''
    };
  }

  saveLocalNavigationState(state) {
    localStorage.setItem(
      this.getLocalNavStateKey(),
      JSON.stringify({
        collapsedNodeIds: state.collapsedNodeIds || []
      })
    );

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

    if (
      state.lastReadSectionId &&
      state.lastReadSectionId !== this._lastSavedSectionId &&
      typeof sync.saveLastReadPosition === 'function'
    ) {
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
    }, 300);
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

  applyDefaultExpansionState() {
    this.treeNodes.forEach((node) => {
      if (!node.hasChildren) {
        return;
      }
      this.toggleNode(node.nodeId, this.isTreeLevelExpandedByDefault(node.level));
    });
  }

  applyCollapsedNodeState(collapsedNodeIds) {
    const collapsedSet = new Set(Array.isArray(collapsedNodeIds) ? collapsedNodeIds : []);
    this.treeNodes.forEach((node) => {
      if (!node.hasChildren) {
        return;
      }
      this.toggleNode(node.nodeId, !collapsedSet.has(node.nodeId));
    });
  }

  restoreActiveSection(sectionId, shouldScroll) {
    if (!sectionId) {
      return;
    }
    this.activateSection(sectionId, {
      scrollPage: !!shouldScroll,
      focusLink: false,
      persist: false
    });
  }

  async restoreNavigationState() {
    let localCollapsed = [];
    let localLastRead = '';
    let hasLocalCollapsedState = false;

    try {
      const local = JSON.parse(localStorage.getItem(this.getLocalNavStateKey()) || '{}');
      hasLocalCollapsedState = Object.prototype.hasOwnProperty.call(local, 'collapsedNodeIds');
      localCollapsed = Array.isArray(local.collapsedNodeIds) ? local.collapsedNodeIds : [];
      localLastRead = localStorage.getItem(this.getLocalLastReadKey()) || '';
    } catch {
      localCollapsed = [];
      localLastRead = '';
      hasLocalCollapsedState = false;
    }

    if (hasLocalCollapsedState) {
      this.applyCollapsedNodeState(localCollapsed);
    } else {
      this.applyDefaultExpansionState();
    }

    if (localLastRead) {
      this.restoreActiveSection(localLastRead, true);
    } else {
      const rootNode = this.treeNodes.find((node) => node.level === 0);
      if (rootNode) {
        this.restoreActiveSection(rootNode.sectionId, false);
      }
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
          this.restoreActiveSection(remoteLastRead, true);
        }
      }
    } catch (error) {
      console.warn('Unable to restore remote topic navigation state:', error);
    }
  }

  startLastReadTracking() {
    const headings = Array.from(
      document.querySelectorAll('#main-content h1[id], #main-content h2[id], #main-content h3[id], #main-content h4[id], #main-content h5[id]')
    );

    if (headings.length === 0) {
      return;
    }

    if ('IntersectionObserver' in window) {
      this._observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

          if (visible.length === 0) {
            return;
          }

          const nextId = visible[0].target.getAttribute('id');
          if (!nextId || nextId === this.activeSectionId) {
            return;
          }

          this.activateSection(nextId, {
            scrollPage: false,
            focusLink: false,
            persist: true
          });
        },
        {
          root: null,
          threshold: 0.45,
          rootMargin: '-80px 0px -45% 0px'
        }
      );

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

    const progressWrap =
      document.querySelector('#study-sidebar .progress') ||
      document.querySelector('.sidebar-content .progress');
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

  async loadContent() {
    try {
      let basePath = window.location.pathname;
      if (basePath.endsWith('/')) {
        basePath = basePath.slice(0, -1);
      }
      if (basePath.endsWith('.html')) {
        basePath = basePath.slice(0, -5);
      }

      const contentFile = `${basePath}.html`;
      const response = await fetch(contentFile);
      if (!response.ok) throw new Error(`Failed to load ${contentFile}`);

      const html = await response.text();
      const mainContent = document.getElementById('main-content');
      mainContent.innerHTML = html;

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

  updatePageMetadata() {
    const topicName = this.formatTopicName(this.topicId);
    document.title = `${topicName} - ${this.labId.charAt(0).toUpperCase() + this.labId.slice(1)}`;

    const breadcrumb = document.getElementById('current-topic');
    if (breadcrumb) {
      breadcrumb.textContent = topicName;
    }

    const homeLink = document.getElementById('home-link');
    if (homeLink) {
      homeLink.href = this.homeLink;
    }
  }

  initializeMobileToggle() {
    const openBtn = document.getElementById('open-sidebar');
    const sidebar = document.querySelector('.side-bar');
    const mainContent = document.getElementById('main-content');

    if (!openBtn || !sidebar || !mainContent) return;

    openBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });

    sidebar.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('active');
      });
    });

    mainContent.addEventListener('click', () => {
      sidebar.classList.remove('active');
    });
  }

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

    if (typeof initializeProgressTracking === 'function') {
      initializeProgressTracking({
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

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.TOPIC_CONFIG !== 'undefined') {
    const loader = new TopicLoader(window.TOPIC_CONFIG);
    await loader.init();
  }
});
