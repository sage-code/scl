(function () {
  var pageSize = 5;
  var page = 0;
  var currentView = 'core';
  var viewCache = {
    core: null,
    learners: null,
    'top-score': null
  };
  var rows = [];

  var status = document.getElementById('members-status');
  var head = document.getElementById('members-head');
  var body = document.getElementById('members-body');
  var prev = document.getElementById('prev-members');
  var next = document.getElementById('next-members');
  var pageLabel = document.getElementById('members-page');
  var viewButtons = Array.prototype.slice.call(document.querySelectorAll('[data-community-view]'));

  var CORE_ROLES = new Set([
    'manager',
    'mentor',
    'developer',
    'ux/ui designer',
    'content creator',
    'qa inspector',
    'code maintainer',
    'apps developer'
  ]);

  var VIEW_HEADERS = {
    core: ['Member', 'Role', 'Certification', 'Since'],
    learners: ['Member', 'Active Roadmaps', 'Completed Topics', 'Last Active'],
    'top-score': ['Rank', 'Member', 'Passed Quizzes', 'Score']
  };

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function trackName(track) {
    return window.sclApi && window.sclApi.community && window.sclApi.community.trackLabel
      ? window.sclApi.community.trackLabel(track)
      : track;
  }

  function safeAvatarUrl(value) {
    if (typeof value !== 'string' || !value.trim()) {
      return '';
    }
    try {
      var url = new URL(value.trim(), window.location.origin);
      if (url.protocol === 'https:') {
        return url.href;
      }
      if (url.origin === window.location.origin && url.pathname.indexOf('/') === 0) {
        return url.pathname + url.search;
      }
      return '';
    } catch (_error) {
      return '';
    }
  }

  function formatRelative(iso) {
    if (!iso) return '—';
    var ms = Date.now() - Date.parse(iso);
    if (Number.isNaN(ms) || ms < 0) return 'Recently';
    var mins = Math.floor(ms / 60000);
    if (mins < 60) return mins <= 1 ? 'Just now' : mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    return days + 'd ago';
  }

  function renderMemberCell(item) {
    var avatarUrl = safeAvatarUrl(item.avatar_url);
    var profileUrl = item.public_id
      ? '/community/profile.html?user_id=' + encodeURIComponent(item.public_id)
      : (item.slug ? '/community/vcp/' + encodeURIComponent(item.slug) + '.html' : '');
    var label = escapeHtml(item.name || item.display_name || item.handle || 'Member');
    var html = '';
    if (avatarUrl) {
      html += '<img class="directory-avatar" src="' + escapeHtml(avatarUrl) + '" alt="" loading="lazy"> ';
    }
    if (profileUrl) {
      html += '<a href="' + escapeHtml(profileUrl) + '">' + label + '</a>';
    } else {
      html += '<span>' + label + '</span>';
    }
    return html;
  }

  function renderHeader() {
    if (!head) return;
    var cols = VIEW_HEADERS[currentView] || VIEW_HEADERS.core;
    head.innerHTML = '<tr>' + cols.map(function (c) {
      return '<th>' + escapeHtml(c) + '</th>';
    }).join('') + '</tr>';
  }

  function render() {
    renderHeader();
    var totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (page >= totalPages) {
      page = totalPages - 1;
    }

    var start = page * pageSize;
    var end = Math.min(start + pageSize, rows.length);
    var html = '';

    for (var i = start; i < end; i += 1) {
      var item = rows[i];
      html += '<tr>';
      if (currentView === 'learners') {
        var trackList = Array.isArray(item.tracks) && item.tracks.length
          ? item.tracks.map(trackName).join(', ')
          : '—';
        html += '<td>' + renderMemberCell(item) + '</td>';
        html += '<td class="small text-secondary">' + escapeHtml(trackList) + '</td>';
        html += '<td>' + escapeHtml(String(item.completed_topics || 0)) + '</td>';
        html += '<td class="small text-secondary">' + escapeHtml(formatRelative(item.last_active_at)) + '</td>';
      } else if (currentView === 'top-score') {
        var scoreText = String(item.total_points || 0) + ' pts (' + Number(item.avg_percent || 0).toFixed(1) + '%)';
        html += '<td>#' + escapeHtml(String(item.rank || (i + 1))) + '</td>';
        html += '<td>' + renderMemberCell(item) + '</td>';
        html += '<td>' + escapeHtml(String(item.passed_quizzes || 0)) + '</td>';
        html += '<td>' + escapeHtml(scoreText) + '</td>';
      } else {
        html += '<td>' + renderMemberCell(item) + '</td>';
        html += '<td>' + escapeHtml(item.role) + '</td>';
        html += '<td>' + escapeHtml(item.certification) + '</td>';
        html += '<td>' + escapeHtml(item.since) + '</td>';
      }
      html += '</tr>';
    }

    // Keep table height stable by always rendering exactly pageSize rows.
    var renderedRows = end - start;
    for (var pad = renderedRows; pad < pageSize; pad += 1) {
      html += '<tr class="text-secondary">';
      html += '<td>&nbsp;</td>';
      html += '<td>&nbsp;</td>';
      html += '<td>&nbsp;</td>';
      html += '<td>&nbsp;</td>';
      html += '</tr>';
    }

    body.innerHTML = html;
    prev.disabled = page === 0;
    next.disabled = end >= rows.length;
    pageLabel.textContent = 'Showing ' + (rows.length ? (start + 1) : 0) + '-' + end + ' of ' + rows.length;
  }

  function isCoreTeamMember(member) {
    if (!member) return false;
    if (member.is_legacy_verified) return true;
    var role = String(member.role || '').trim().toLowerCase();
    return CORE_ROLES.has(role);
  }

  function mapGraduate(member) {
    var claimedAt = member.claimed_at ? new Date(member.claimed_at) : null;
    var sinceValue = member.member_since != null
      ? member.member_since
      : (!claimedAt || Number.isNaN(claimedAt.getTime()) ? '—' : claimedAt.getFullYear());
    return {
      public_id: member.public_id,
      name: member.display_name,
      role: member.role || 'Student',
      certification: member.certification_label || (member.qualified_track ? (trackName(member.qualified_track) + ' roadmap') : '—'),
      since: sinceValue,
      avatar_url: member.avatar_url,
      is_legacy_verified: !!member.is_legacy_verified
    };
  }

  function setStatus(message, kind) {
    status.hidden = !message;
    status.className = 'alert alert-' + kind;
    status.textContent = message;
  }

  var VIEW_STORAGE_KEY = 'sage_community_view';
  var VALID_VIEWS = new Set(['core', 'learners', 'top-score']);

  function readSavedView() {
    try {
      var saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
      return VALID_VIEWS.has(saved) ? saved : 'core';
    } catch (_error) {
      return 'core';
    }
  }

  function saveView(view) {
    try {
      if (VALID_VIEWS.has(view)) {
        window.localStorage.setItem(VIEW_STORAGE_KEY, view);
      }
    } catch (_error) {
      // Ignore storage errors (private mode / quota).
    }
  }

  function setActiveButton(view) {
    viewButtons.forEach(function (btn) {
      var active = btn.getAttribute('data-community-view') === view;
      btn.disabled = false;
      btn.classList.remove('disabled');
      btn.removeAttribute('aria-disabled');
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
      var radioIcon = btn.querySelector('.community-view-radio');
      if (radioIcon) {
        radioIcon.className = 'bi ' + (active ? 'bi-record-circle-fill' : 'bi-circle') + ' community-view-radio';
      }
    });
  }

  async function loadCoreTeam() {
    if (viewCache.core) {
      return viewCache.core;
    }

    var errors = [];
    var legacyMembers = [];
    var graduateMembers = [];

    try {
      var response = await fetch('/community/members.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Legacy member list request failed (HTTP ' + response.status + ').');
      }
      var data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Legacy member list has an invalid format.');
      }
      legacyMembers = data;
    } catch (error) {
      errors.push(error.message || 'Legacy member list could not be loaded.');
    }

    if (window.sclApi && window.sclApi.community) {
      var result = await window.sclApi.community.directory();
      if (result.error) {
        errors.push('Community directory could not be loaded: ' + result.error.message);
      } else if (!result.data || !Array.isArray(result.data.members)) {
        errors.push('Community directory returned an invalid response.');
      } else {
        graduateMembers = result.data.members
          .filter(function (member) {
            return member && typeof member.public_id === 'string' && typeof member.display_name === 'string';
          })
          .map(mapGraduate)
          .filter(isCoreTeamMember);
      }
    }

    var seenIds = new Set(graduateMembers.map(function (member) { return member.public_id; }));
    var remainingLegacy = legacyMembers.filter(function (member) {
      return !seenIds.has(member.slug);
    });
    var list = graduateMembers.concat(remainingLegacy);
    var payload = { rows: list, errors: errors };
    viewCache.core = payload;
    return payload;
  }

  async function loadLearners() {
    if (viewCache.learners) {
      return viewCache.learners;
    }
    if (!window.sclApi || !window.sclApi.roadmap) {
      return { rows: [], errors: ['Learner API client is not available.'] };
    }
    var result = await window.sclApi.roadmap.learners();
    if (result.error) {
      return { rows: [], errors: [result.error.message || 'Could not load active learners.'] };
    }
    var list = (result.data && Array.isArray(result.data.learners))
      ? result.data.learners.filter(function (l) { return l && Array.isArray(l.tracks) && l.tracks.length > 0; })
      : [];
    var payload = { rows: list, errors: [] };
    viewCache.learners = payload;
    return payload;
  }

  async function loadTopScore() {
    if (viewCache['top-score']) {
      return viewCache['top-score'];
    }
    if (!window.sclApi || !window.sclApi.roadmap) {
      return { rows: [], errors: ['Leaderboard API client is not available.'] };
    }
    var result = await window.sclApi.roadmap.leaderboard();
    if (result.error) {
      return { rows: [], errors: [result.error.message || 'Could not load top scores.'] };
    }
    var list = (result.data && Array.isArray(result.data.leaders))
      ? result.data.leaders.filter(function (entry) { return entry && Number(entry.passed_quizzes || 0) >= 1; })
      : [];
    var payload = { rows: list, errors: [] };
    viewCache['top-score'] = payload;
    return payload;
  }

  async function selectView(view) {
    var targetView = VALID_VIEWS.has(view) ? view : 'core';
    currentView = targetView;
    page = 0;
    saveView(targetView);
    setActiveButton(targetView);

    if (targetView === 'core') {
      setStatus('Core Team: Managers, Mentors and Developers', 'info');
    } else if (targetView === 'learners') {
      setStatus("Loading Who's Learning…", 'info');
    } else if (targetView === 'top-score') {
      setStatus('Loading Top Score…', 'info');
    }

    var payload;
    if (targetView === 'learners') {
      payload = await loadLearners();
    } else if (targetView === 'top-score') {
      payload = await loadTopScore();
    } else {
      payload = await loadCoreTeam();
    }

    if (currentView !== targetView) {
      return;
    }

    rows = payload.rows;
    render();

    if (payload.errors.length) {
      setStatus(payload.errors.join(' '), 'warning');
      return;
    }

    if (targetView === 'core') {
      setStatus('Core Team: Managers, Mentors and Developers', 'info');
    } else if (targetView === 'learners') {
      setStatus(
        rows.length
          ? ("Who's Learning: Members with active roadmaps (" + rows.length + ')')
          : "Who's Learning: No members with active roadmaps yet.",
        'info'
      );
    } else if (targetView === 'top-score') {
      setStatus(
        rows.length
          ? ('Top Score: Members who passed at least one quiz (' + rows.length + ')')
          : 'Top Score: No members have passed a quiz yet.',
        'info'
      );
    }
  }

  viewButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var view = btn.getAttribute('data-community-view');
      if (view) {
        selectView(view).catch(function (error) {
          setStatus(error.message || 'Community view could not be loaded.', 'danger');
          rows = [];
          render();
        });
      }
    });
  });

  prev.addEventListener('click', function () {
    if (page > 0) {
      page -= 1;
      render();
    }
  });

  next.addEventListener('click', function () {
    var totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (page < totalPages - 1) {
      page += 1;
      render();
    }
  });

  selectView(readSavedView()).catch(function (error) {
    setStatus(error.message || 'Community members could not be loaded.', 'danger');
    rows = [];
    render();
  });
})();
