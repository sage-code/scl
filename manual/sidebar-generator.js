/**
 * Sidebar Generator Library
 * Dynamically creates sidebars with progress tracking
 * Home link points to #topics for better UX
 */

function generateSidebarHTML(topics, homeLink = './index.html#topics') {
  /**
   * Generate topic list items recursively
   * @param {Array} topicsList - Array of topic objects with id, label, children
   * @param {number} startIndex - Starting index for unique checkbox IDs
   * @returns {Object} {html: string, nextIndex: number}
   */
  function generateTopicItems(topicsList, startIndex = 0) {
    let html = '';
    let currentIndex = startIndex;

    topicsList.forEach((topic) => {
      const checkId = `nav-${currentIndex}`;
      const hashLink = topic.link || `#${topic.id}`;

      html += `<li class="nav-item mb-2">`;
      html += `<input type="checkbox" class="form-check-input me-2" id="${checkId}" data-isTrackable="true" data-link="${hashLink}">`;
      html += `<a href="${hashLink}" class="text-info text-decoration-none">${topic.label}</a>`;

      // Nested children if they exist
      if (topic.children && Array.isArray(topic.children)) {
        html += `<ul class="list-unstyled ms-4 mt-1">`;
        currentIndex++;

        topic.children.forEach((child) => {
          const childCheckId = `nav-${currentIndex}`;
          const childHashLink = child.link || `#${child.id}`;

          html += `<li class="nav-item">`;
          html += `<input type="checkbox" class="form-check-input me-2" id="${childCheckId}" data-isTrackable="true" data-link="${childHashLink}">`;
          html += `<a href="${childHashLink}" class="text-info text-decoration-none">${child.label}</a>`;
          html += `</li>`;

          currentIndex++;
        });

        html += `</ul>`;
      }

      html += `</li>`;
      currentIndex++;
    });

    return { html, nextIndex: currentIndex };
  }

  const { html: topicListHTML } = generateTopicItems(topics);

  const sidebarHTML = `
    <div class="d-flex justify-content-between align-items-center mb-0">
      <h5 class="mb-0">Lab Topics</h5>
    </div>
    <hr>
    <ul id="bookmark-list" class="list-unstyled">
      ${topicListHTML}
    </ul>
  `;

  return sidebarHTML;
}

/**
 * Initialize sidebar with generated content
 * @param {string} containerId - ID of the container to populate
 * @param {Array} topics - Array of topic objects
 * @param {string} homeLink - Home link with anchor (default: ./index.html#topics)
 */
function initSidebar(containerId, topics, homeLink = './index.html#topics') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Sidebar container with ID "${containerId}" not found`);
    return;
  }

  const sidebarHTML = generateSidebarHTML(topics, homeLink);
  container.innerHTML = sidebarHTML;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateSidebarHTML, initSidebar };
}

