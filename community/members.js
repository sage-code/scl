(function () {
  var pageSize = 5;
  var page = 0;
  var members = [];

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
      var profileUrl = '/community/vip/' + m.slug + '.html';
      html += '<tr>';
      html += '<td><a href="' + profileUrl + '">' + escapeHtml(m.name) + '</a></td>';
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

  function loadMembers() {
    fetch('/community/members.json', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Failed to load members');
        }
        return response.json();
      })
      .then(function (data) {
        members = Array.isArray(data) ? data : [];
        render();
      })
      .catch(function () {
        members = [];
        render();
      });
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

  loadMembers();
})();
