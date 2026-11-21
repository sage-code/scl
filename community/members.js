(function () {
  var pageSize = 5;
  var page = 0;
  var members = [];
  var status = document.getElementById('members-status');

  var body = document.getElementById('members-body');
  var prev = document.getElementById('prev-members');
  var next = document.getElementById('next-members');
  var pageLabel = document.getElementById('members-page');

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function render() {
    var totalPages = Math.max(1, Math.ceil(members.length / pageSize));
    if (page >= totalPages) {
      page = totalPages - 1;
    }

    var start = page * pageSize;
    var end = Math.min(start + pageSize, members.length);
    var html = '';

    for (var i = start; i < end; i += 1) {
      var m = members[i];
      var profileUrl = m.public_id
        ? '/community/profile.html?user_id=' + encodeURIComponent(m.public_id)
        : '/community/vcp/' + encodeURIComponent(m.slug) + '.html';
      var avatarUrl = safeAvatarUrl(m.avatar_url);
      html += '<tr>';
      html += '<td>';
      if (avatarUrl) {
        html += '<img class="directory-avatar" src="' + escapeHtml(avatarUrl) + '" alt="" loading="lazy"> ';
      }
      html += '<a href="' + escapeHtml(profileUrl) + '">' + escapeHtml(m.name) + '</a></td>';
      html += '<td>' + escapeHtml(m.role) + '</td>';
      html += '<td>' + escapeHtml(m.certification) + '</td>';
      html += '<td>' + escapeHtml(m.since) + '</td>';
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
    next.disabled = end >= members.length;
    pageLabel.textContent = 'Showing ' + (members.length ? (start + 1) : 0) + '-' + end + ' of ' + members.length;
  }

  function trackName(track) {
    return window.sclApi && window.sclApi.community && window.sclApi.community.trackLabel
      ? window.sclApi.community.trackLabel(track)
      : track;
  }

  function safeAvatarUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === 'https:' ? url.href : '';
    } catch (_error) {
      return '';
    }
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
      avatar_url: member.avatar_url
    };
  }

  function setStatus(message, kind) {
    status.hidden = !message;
    status.className = 'alert alert-' + kind;
    status.textContent = message;
  }

  async function loadMembers() {
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
        .map(mapGraduate);
    }

    var seenIds = new Set(graduateMembers.map(function (member) { return member.public_id; }));
    var remainingLegacy = legacyMembers.filter(function (member) {
      return !seenIds.has(member.slug);
    });
    members = graduateMembers.concat(remainingLegacy);
    render();
    if (errors.length) {
      setStatus(errors.join(' '), 'warning');
    } else if (graduateMembers.length === 0) {
      setStatus('No community profiles are listed yet.', 'info');
    } else {
      setStatus(graduateMembers.length + ' community member(s) listed.', 'success');
    }
  }

  prev.addEventListener('click', function () {
    if (page > 0) {
      page -= 1;
      render();
    }
  });

  next.addEventListener('click', function () {
    var totalPages = Math.max(1, Math.ceil(members.length / pageSize));
    if (page < totalPages - 1) {
      page += 1;
      render();
    }
  });

  loadMembers().catch(function (error) {
    setStatus(error.message || 'Community members could not be loaded.', 'danger');
    members = [];
    render();
  });
})();
