/* ==========================================================================
   Brain — Application shell
   Navigation injection, topbar chrome, modals, toasts, confirm dialogs,
   habit toggles, theme switching, boot sequence, and the global voice
   entry point shared by every page.
   ========================================================================== */
(function (global) {
  'use strict';

  var Brain = global.Brain = global.Brain || {};
  var State = Brain.State;

  /* ---------------------------------------------------------------------- */
  /* Icons — small original line-icon set (24x24, stroke-based)             */
  /* ---------------------------------------------------------------------- */
  function svg(inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }
  var ICONS = {
    home: svg('<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5v-6h4v6"/>'),
    dumbbell: svg('<path d="M5 9v6"/><path d="M3 8.5v7"/><path d="M19 9v6"/><path d="M21 8.5v7"/><path d="M7 12h10"/>'),
    nutrition: svg('<path d="M12 7c-3 0-5.5 2.6-5.5 6.4C6.5 17.4 9 20 12 20s5.5-2.6 5.5-6.6C17.5 9.6 15 7 12 7Z"/><path d="M12 7c0-1.8 1-3 2.5-3.4"/>'),
    habits: svg('<circle cx="12" cy="12" r="8.2"/><path d="M8.5 12.3l2.3 2.3 4.7-5.2"/>'),
    work: svg('<rect x="3.5" y="7.5" width="17" height="11.5" rx="2"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"/><path d="M3.5 12.5h17"/>'),
    applications: svg('<path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h7"/><circle cx="18" cy="16" r="3"/>'),
    insights: svg('<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 19v-6"/><path d="M12.5 19V8"/><path d="M17 19v-9.5"/>'),
    assistant: svg('<path d="M12 3.5l1.4 3.8 3.8 1.4-3.8 1.4L12 14l-1.4-3.9L6.8 8.7l3.8-1.4Z"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/>'),
    integrations: svg('<path d="M9 3v4"/><path d="M15 3v4"/><rect x="6" y="7" width="12" height="7" rx="2"/><path d="M12 14v3"/><path d="M9 20.5h6"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.4M12 18.1v2.4M5.4 6.4l1.7 1.7M16.9 15.9l1.7 1.7M3.5 12h2.4M18.1 12h2.4M5.4 17.6l1.7-1.7M16.9 8.1l1.7-1.7"/>'),
    bell: svg('<path d="M7 10a5 5 0 0 1 10 0v4l1.5 2.5h-13L7 14Z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    mic: svg('<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3.5"/><path d="M9 20.5h6"/>'),
    moon: svg('<path d="M19 14.5A8 8 0 1 1 9.5 5a6.4 6.4 0 0 0 9.5 9.5Z"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M3 12h2M19 12h2M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4"/>'),
    sync: svg('<path d="M5 10a7 7 0 0 1 12-4.5L19 7"/><path d="M19 4.5V7h-2.5"/><path d="M19 14a7 7 0 0 1-12 4.5L5 17"/><path d="M5 19.5V17h2.5"/>'),
    chevronDown: svg('<path d="M6 9l6 6 6-6"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/>'),
    water: svg('<path d="M12 3.5s6 6.4 6 10.6a6 6 0 1 1-12 0c0-4.2 6-10.6 6-10.6Z"/>'),
    flame: svg('<path d="M12 3s4 4.2 4 8a4 4 0 1 1-8 0c0-1 .3-1.8.8-2.6.3.9 1 1.2 1.6.7C9.7 7.6 9 6 9 4.5 9 3.7 10.3 3 12 3Z"/>'),
    fiber: svg('<path d="M5 19c7 0 13-6 13-13"/><path d="M9 19c4-2 7-6 7-10"/><path d="M5 19h4"/>'),
    footsteps: svg('<ellipse cx="9" cy="8" rx="2.2" ry="3"/><ellipse cx="15.5" cy="15" rx="2.2" ry="3"/>'),
    sleep: svg('<path d="M19 14.5A8 8 0 1 1 9.5 5a6.4 6.4 0 0 0 9.5 9.5Z"/>'),
    scale: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 9v3l2 2"/>'),
    target: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6"/>'),
    plug: svg('<path d="M9 3v5M15 3v5"/><rect x="7" y="8" width="10" height="6" rx="2"/><path d="M12 14v4"/><path d="M8 21h8"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7"/>'),
    chart: svg('<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16l3-4 3 2 4-6"/>'),
    arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    volume: svg('<path d="M5 9.5v5h3.5L13 18V6L8.5 9.5Z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>'),
    warning: svg('<path d="M12 4 21 19H3Z"/><path d="M12 10v4"/><path d="M12 16.5h.01"/>'),
    info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 8.2h.01"/>'),
    lock: svg('<rect x="5.5" y="10.5" width="13" height="9" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
    trash: svg('<path d="M5 7h14"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M7 7l1 12.5h8L17 7"/>'),
    download: svg('<path d="M12 4v11"/><path d="M7.5 11.5 12 16l4.5-4.5"/><path d="M5 19.5h14"/>'),
    grid: svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
    barcode: svg('<path d="M4 5v14"/><path d="M8 5v14"/><path d="M11 5v14"/><path d="M15 5v14"/><path d="M18 5v14"/><path d="M21 5v14"/>')
  };

  /* ---------------------------------------------------------------------- */
  /* Navigation config                                                      */
  /* ---------------------------------------------------------------------- */
  var NAV_ITEMS = [
    { id: 'home', href: 'index.html', label: 'Home', icon: 'home' },
    { id: 'workouts', href: 'workouts.html', label: 'Workouts', icon: 'dumbbell' },
    { id: 'nutrition', href: 'nutrition.html', label: 'Nutrition', icon: 'nutrition' },
    { id: 'habits', href: 'habits.html', label: 'Habits', icon: 'habits' },
    { id: 'work', href: 'work.html', label: 'Work', icon: 'work' },
    { id: 'applications', href: 'applications.html', label: 'Applications', icon: 'applications' },
    { id: 'insights', href: 'insights.html', label: 'Insights', icon: 'insights' },
    { id: 'assistant', href: 'assistant.html', label: 'Assistant', icon: 'assistant' },
    { id: 'integrations', href: 'integrations.html', label: 'Integrations', icon: 'integrations' },
    { id: 'settings', href: 'settings.html', label: 'Settings', icon: 'settings' }
  ];
  var BOTTOM_NAV_PRIMARY = ['home', 'workouts', 'nutrition', 'work', 'assistant'];
  var BOTTOM_NAV_MORE = ['habits', 'applications', 'insights', 'integrations', 'settings', 'voice-console'];

  function currentPage() { return document.body.getAttribute('data-page') || 'home'; }

  function renderSidebar() {
    var host = document.getElementById('sidebar-root');
    if (!host) return;
    var page = currentPage();
    var html = '' +
      '<nav class="sidebar" aria-label="Primary">' +
      '<a class="sidebar-brand" href="index.html" aria-label="Brain home">' +
      '<span class="brand-mark">' + ICONS.assistant.replace('currentColor', '#03141a') + '</span>' +
      '<span class="brand-name">Br<span>ain</span></span>' +
      '</a>' +
      '<ul class="nav-list">' +
      NAV_ITEMS.map(function (item) {
        var current = item.id === page ? ' aria-current="page"' : '';
        return '<li><a class="nav-link" href="' + item.href + '"' + current + '>' + ICONS[item.icon] + '<span>' + item.label + '</span></a></li>';
      }).join('') +
      '</ul>' +
      '<div class="nav-foot">' +
      '<div class="sync-status"><span class="sync-dot" id="sync-dot"></span><span id="sync-text">All systems synced</span></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="theme-toggle-btn" style="justify-content:flex-start">' +
      '<span id="theme-toggle-icon">' + ICONS.moon + '</span><span id="theme-toggle-label">Dark mode</span></button>' +
      '</div>' +
      '</nav>';
    host.innerHTML = html;
  }

  function renderBottomNav() {
    var host = document.getElementById('bottomnav-root');
    if (!host) return;
    var page = currentPage();
    function itemFor(id) { return NAV_ITEMS.filter(function (n) { return n.id === id; })[0]; }
    var primaryHtml = BOTTOM_NAV_PRIMARY.map(function (id) {
      var item = itemFor(id);
      var current = id === page ? ' aria-current="page"' : '';
      return '<a class="bottom-nav-link" href="' + item.href + '"' + current + '>' + ICONS[item.icon] + '<span>' + item.label + '</span></a>';
    }).join('');
    var moreHtml = '<button type="button" class="bottom-nav-link" id="more-menu-btn" aria-haspopup="true" aria-expanded="false">' + ICONS.grid + '<span>More</span></button>';
    host.innerHTML = '<nav class="bottom-nav" aria-label="Primary"><div class="bottom-nav-list">' + primaryHtml + moreHtml + '</div></nav>';

    document.getElementById('more-menu-btn').addEventListener('click', function () { openMoreSheet(); });
  }

  function openMoreSheet() {
    var page = currentPage();
    function itemFor(id) {
      if (id === 'voice-console') return { href: 'voice-console.html', label: 'Voice Console', icon: 'mic' };
      return NAV_ITEMS.filter(function (n) { return n.id === id; })[0];
    }
    var rows = BOTTOM_NAV_MORE.map(function (id) {
      var item = itemFor(id);
      var current = id === page ? ' aria-current="page"' : '';
      return '<a class="nav-link" style="padding:12px" href="' + item.href + '"' + current + '>' + ICONS[item.icon] + '<span>' + item.label + '</span></a>';
    }).join('');
    showSheet('More', rows);
  }

  function showSheet(title, innerHtml) {
    var existing = document.getElementById('sheet-overlay');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'sheet-overlay';
    el.className = 'overlay is-open';
    el.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + title + '">' +
      '<div class="modal-head"><h2 class="modal-title">' + title + '</h2><button type="button" class="modal-close" aria-label="Close">' + ICONS.close + '</button></div>' +
      '<div class="modal-body"><ul class="nav-list">' + innerHtml + '</ul></div></div>';
    document.body.appendChild(el);
    el.querySelector('.modal-close').addEventListener('click', function () { el.remove(); });
    el.addEventListener('click', function (e) { if (e.target === el) el.remove(); });
  }

  /* ---------------------------------------------------------------------- */
  /* Topbar chrome                                                          */
  /* ---------------------------------------------------------------------- */
  function renderTopbar() {
    var host = document.getElementById('topbar-root');
    if (!host) return;
    var name = State.data.profile.name;
    var initials = State.data.profile.initials;
    var now = new Date();
    var hour = now.getHours();
    var greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    var dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    host.innerHTML = '' +
      '<header class="topbar">' +
      '<div class="topbar-left">' +
      '<button type="button" class="icon-btn mobile-menu-btn" id="mobile-more-btn" aria-label="Open navigation menu">' + ICONS.grid + '</button>' +
      '<div class="greeting-block"><p class="greeting">' + greeting + ', ' + name + '</p><p class="greeting-date">' + dateStr + '</p></div>' +
      '</div>' +
      '<div class="topbar-right">' +
      '<button type="button" class="icon-btn" id="theme-toggle-btn-top" aria-label="Toggle dark or light mode">' + ICONS.moon + '</button>' +
      '<button type="button" class="icon-btn" id="notif-btn" aria-label="Notifications">' + ICONS.bell + '<span class="badge-dot"></span></button>' +
      '<button type="button" class="btn btn-secondary btn-sm" id="quick-add-btn">' + ICONS.plus + '<span>Quick add</span></button>' +
      '<button type="button" class="avatar" id="avatar-btn" aria-label="Profile menu">' + initials + '</button>' +
      '</div>' +
      '</header>';

    document.getElementById('mobile-more-btn').addEventListener('click', openMoreSheet);
    document.getElementById('quick-add-btn').addEventListener('click', openQuickAdd);
    document.getElementById('avatar-btn').addEventListener('click', function () { window.location.href = 'settings.html'; });
    document.getElementById('notif-btn').addEventListener('click', function () { openNotifications(); });
    ['theme-toggle-btn-top'].forEach(function (id) {
      document.getElementById(id).addEventListener('click', toggleTheme);
    });
  }

  function openNotifications() {
    var rows = [
      { icon: 'warning', text: 'Vertex Systems final interview is tomorrow at 2:00 PM.' },
      { icon: 'check', text: 'Habit streak: Study cybersecurity — 15 days.' },
      { icon: 'info', text: 'Lower Body workout synced from yesterday.' }
    ].map(function (n) {
      return '<div class="list-row"><span style="color:var(--accent-cyan)">' + ICONS[n.icon] + '</span><span style="font-size:13.5px">' + n.text + '</span></div>';
    }).join('');
    showSheet('System alerts', rows);
  }

  /* ---------------------------------------------------------------------- */
  /* Theme                                                                  */
  /* ---------------------------------------------------------------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var isDark = theme !== 'light';
    document.querySelectorAll('#theme-toggle-icon, #theme-toggle-btn-top').forEach(function (el) {
      if (el.id === 'theme-toggle-btn-top') el.innerHTML = isDark ? ICONS.moon : ICONS.sun;
    });
    var icon = document.getElementById('theme-toggle-icon');
    if (icon) icon.innerHTML = isDark ? ICONS.moon : ICONS.sun;
    var label = document.getElementById('theme-toggle-label');
    if (label) label.textContent = isDark ? 'Dark mode' : 'Light mode';
  }

  function toggleTheme() {
    var next = State.data.settings.theme === 'light' ? 'dark' : 'light';
    State.data.settings.theme = next;
    State.save();
    applyTheme(next);
  }

  /* ---------------------------------------------------------------------- */
  /* Toasts                                                                 */
  /* ---------------------------------------------------------------------- */
  function ensureToastRegion() {
    var region = document.getElementById('toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toast-region';
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    return region;
  }

  function showToast(message, type) {
    type = type || 'info';
    var region = ensureToastRegion();
    var el = document.createElement('div');
    el.className = 'toast ' + type;
    var icon = type === 'success' ? ICONS.check : type === 'warn' ? ICONS.warning : ICONS.info;
    el.innerHTML = icon + '<span class="toast-text">' + message + '</span>';
    region.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity 200ms';
      setTimeout(function () { el.remove(); }, 220);
    }, 3600);
  }

  /* ---------------------------------------------------------------------- */
  /* Modals + confirm dialog                                                */
  /* ---------------------------------------------------------------------- */
  function openModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('is-open');
    var focusable = el.querySelector('input, select, textarea, button');
    if (focusable) focusable.focus();
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('is-open');
  }
  function wireModalDismiss() {
    document.querySelectorAll('.overlay').forEach(function (el) {
      el.addEventListener('click', function (e) { if (e.target === el) el.classList.remove('is-open'); });
      var closeBtn = el.querySelector('[data-modal-close]');
      if (closeBtn) closeBtn.addEventListener('click', function () { el.classList.remove('is-open'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.overlay.is-open').forEach(function (el) { el.classList.remove('is-open'); });
      }
    });
  }

  function confirmAction(opts) {
    var existing = document.getElementById('confirm-overlay');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'confirm-overlay';
    el.className = 'overlay is-open';
    el.innerHTML = '' +
      '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">' +
      '<div class="modal-head"><h2 class="modal-title" id="confirm-title">' + (opts.title || 'Confirm action') + '</h2>' +
      '<button type="button" class="modal-close" data-modal-close aria-label="Close">' + ICONS.close + '</button></div>' +
      '<div class="modal-body"><p style="font-size:14px;color:var(--text-secondary)">' + opts.body + '</p></div>' +
      '<div class="modal-foot">' +
      '<button type="button" class="btn btn-ghost" id="confirm-cancel-btn">Cancel</button>' +
      '<button type="button" class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" id="confirm-ok-btn">' + (opts.confirmLabel || 'Confirm') + '</button>' +
      '</div></div>';
    document.body.appendChild(el);
    function cleanup() { el.remove(); }
    el.querySelector('[data-modal-close]').addEventListener('click', cleanup);
    el.addEventListener('click', function (e) { if (e.target === el) cleanup(); });
    document.getElementById('confirm-cancel-btn').addEventListener('click', function () { cleanup(); if (opts.onCancel) opts.onCancel(); });
    document.getElementById('confirm-ok-btn').addEventListener('click', function () {
      cleanup();
      if (opts.onConfirm) opts.onConfirm();
      if (Brain.Sound) Brain.Sound.play('confirm');
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Quick add                                                              */
  /* ---------------------------------------------------------------------- */
  function openQuickAdd() {
    var rows = [
      { icon: 'scale', label: 'Log weight', action: function () { openModal('modal-log-weight'); } },
      { icon: 'nutrition', label: 'Add meal', action: function () { openModal('modal-add-meal'); } },
      { icon: 'work', label: 'Add task', action: function () { openModal('modal-add-task'); } },
      { icon: 'applications', label: 'Add application', action: function () { window.location.href = 'applications.html?new=1'; } },
      { icon: 'dumbbell', label: 'Log a set', action: function () { window.location.href = 'workout-session.html'; } }
    ];
    var html = rows.map(function (r, i) {
      return '<li><button type="button" class="nav-link" style="width:100%;text-align:left;padding:12px" data-qa-idx="' + i + '">' + ICONS[r.icon] + '<span>' + r.label + '</span></button></li>';
    }).join('');
    showSheet('Quick add', html);
    var sheet = document.getElementById('sheet-overlay');
    sheet.querySelectorAll('[data-qa-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sheet.remove();
        rows[parseInt(btn.getAttribute('data-qa-idx'), 10)].action();
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Global modals (log weight / add meal / add task) — shared by every     */
  /* page so the topbar quick-add menu always works.                       */
  /* ---------------------------------------------------------------------- */
  function renderGlobalModals() {
    var host = document.getElementById('global-modals-root');
    if (!host) return;
    host.innerHTML = '' +
      '<div class="overlay" id="modal-log-weight"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="lw-title">' +
      '<div class="modal-head"><h2 class="modal-title" id="lw-title">Log weight</h2><button type="button" class="modal-close" data-modal-close aria-label="Close">' + ICONS.close + '</button></div>' +
      '<form class="modal-body" id="form-log-weight">' +
      '<div class="field"><label for="lw-value">Weight (' + (State.data.weight.unit) + ')</label><input id="lw-value" name="value" type="number" step="0.1" min="50" max="600" required value="' + State.data.weight.history[State.data.weight.history.length - 1].value + '"></div>' +
      '<div class="field"><label for="lw-date">Date</label><input id="lw-date" name="date" type="date" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
      '<div class="modal-foot"><button type="button" class="btn btn-ghost" data-modal-close>Cancel</button><button type="submit" class="btn btn-primary">Save entry</button></div>' +
      '</form></div></div>' +

      '<div class="overlay" id="modal-add-meal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="am-title">' +
      '<div class="modal-head"><h2 class="modal-title" id="am-title">Add meal</h2><button type="button" class="modal-close" data-modal-close aria-label="Close">' + ICONS.close + '</button></div>' +
      '<form class="modal-body" id="form-add-meal">' +
      '<div class="field"><label for="am-name">Meal name</label><input id="am-name" name="name" type="text" required placeholder="e.g. Dinner"></div>' +
      '<div class="field-row">' +
      '<div class="field"><label for="am-cal">Calories</label><input id="am-cal" name="calories" type="number" min="0" required></div>' +
      '<div class="field"><label for="am-protein">Protein (g)</label><input id="am-protein" name="protein" type="number" min="0" required></div>' +
      '</div>' +
      '<div class="field-row">' +
      '<div class="field"><label for="am-carbs">Carbs (g)</label><input id="am-carbs" name="carbs" type="number" min="0" value="0"></div>' +
      '<div class="field"><label for="am-fat">Fat (g)</label><input id="am-fat" name="fat" type="number" min="0" value="0"></div>' +
      '</div>' +
      '<div class="modal-foot"><button type="button" class="btn btn-ghost" data-modal-close>Cancel</button><button type="submit" class="btn btn-primary">Add meal</button></div>' +
      '</form></div></div>' +

      '<div class="overlay" id="modal-add-task"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="at-title">' +
      '<div class="modal-head"><h2 class="modal-title" id="at-title">Add task</h2><button type="button" class="modal-close" data-modal-close aria-label="Close">' + ICONS.close + '</button></div>' +
      '<form class="modal-body" id="form-add-task">' +
      '<div class="field"><label for="at-title-input">Title</label><input id="at-title-input" name="title" type="text" required placeholder="e.g. Finish reading assignment"></div>' +
      '<div class="field-row">' +
      '<div class="field"><label for="at-type">Type</label><select id="at-type" name="type"><option value="task">Task</option><option value="assignment">Assignment</option><option value="project">Project</option></select></div>' +
      '<div class="field"><label for="at-priority">Priority</label><select id="at-priority" name="priority"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></div>' +
      '</div>' +
      '<div class="field"><label for="at-due">Due</label><input id="at-due" name="due" type="text" placeholder="e.g. Tomorrow, 5:00 PM"></div>' +
      '<div class="modal-foot"><button type="button" class="btn btn-ghost" data-modal-close>Cancel</button><button type="submit" class="btn btn-primary">Add task</button></div>' +
      '</form></div></div>';

    wireModalDismiss();

    document.getElementById('form-log-weight').addEventListener('submit', function (e) {
      e.preventDefault();
      var val = parseFloat(document.getElementById('lw-value').value);
      var date = document.getElementById('lw-date').value || new Date().toISOString().slice(0, 10);
      State.data.weight.history.push({ date: date, value: val });
      State.save();
      closeModal('modal-log-weight');
      showToast('Weight logged: ' + val + ' ' + State.data.weight.unit + '.', 'success');
      if (Brain.Sound) Brain.Sound.play('success');
      document.dispatchEvent(new CustomEvent('lifeos:weight-logged'));
    });

    document.getElementById('form-add-meal').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var meal = {
        id: 'm' + Date.now(),
        name: f.name.value,
        time: new Date().toTimeString().slice(0, 5),
        calories: parseInt(f.calories.value, 10) || 0,
        protein: parseInt(f.protein.value, 10) || 0,
        carbs: parseInt(f.carbs.value, 10) || 0,
        fat: parseInt(f.fat.value, 10) || 0,
        items: []
      };
      State.data.nutrition.meals.push(meal);
      State.data.today.calories.consumed += meal.calories;
      State.data.today.protein.consumed += meal.protein;
      State.data.today.carbs.consumed += meal.carbs;
      State.data.today.fat.consumed += meal.fat;
      State.save();
      closeModal('modal-add-meal');
      f.reset();
      showToast('"' + meal.name + '" added to today’s log.', 'success');
      if (Brain.Sound) Brain.Sound.play('success');
      document.dispatchEvent(new CustomEvent('lifeos:meal-added'));
    });

    document.getElementById('form-add-task').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var task = {
        id: 'tk' + Date.now(),
        title: f.title.value,
        type: f.type.value,
        priority: f.priority.value,
        due: f.due.value || 'No due date',
        completed: false
      };
      State.data.work.tasks.unshift(task);
      State.save();
      closeModal('modal-add-task');
      f.reset();
      showToast('"' + task.title + '" added to your work queue.', 'success');
      if (Brain.Sound) Brain.Sound.play('success');
      document.dispatchEvent(new CustomEvent('lifeos:task-added'));
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Habit toggles (delegated, works on index + habits page)                */
  /* ---------------------------------------------------------------------- */
  function wireHabitToggles(root) {
    (root || document).addEventListener('click', function (e) {
      var btn = e.target.closest('[data-habit-toggle]');
      if (!btn) return;
      var id = btn.getAttribute('data-habit-toggle');
      var habit = State.data.habits.filter(function (h) { return h.id === id; })[0];
      if (!habit) return;
      habit.completedToday = !habit.completedToday;
      habit.week[habit.week.length - 1] = habit.completedToday ? 1 : 0;
      habit.streak = habit.completedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1);
      State.save();
      if (Brain.Sound) Brain.Sound.play(habit.completedToday ? 'success' : 'notification');
      showToast(habit.completedToday ? '"' + habit.name + '" marked complete.' : '"' + habit.name + '" marked incomplete.', 'success');
      document.dispatchEvent(new CustomEvent('lifeos:habits-changed'));
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Boot sequence                                                          */
  /* ---------------------------------------------------------------------- */
  function runBootSequence() {
    var overlay = document.getElementById('boot-overlay');
    if (!overlay) return;
    if (sessionStorage.getItem('lifeos.booted')) { overlay.setAttribute('hidden', ''); return; }
    var statusEl = overlay.querySelector('.boot-status');
    var barFill = overlay.querySelector('.boot-bar-fill');
    var skipBtn = overlay.querySelector('.boot-skip');
    var lines = [
      'Initializing Brain core…',
      'Loading nutrition, fitness, and work data…',
      'Connecting system interfaces…',
      'Calibrating ' + State.data.profile.assistantName + ' voice console…',
      'Command Center ready.'
    ];
    var i = 0;
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      sessionStorage.setItem('lifeos.booted', '1');
      overlay.classList.add('is-leaving');
      setTimeout(function () { overlay.setAttribute('hidden', ''); }, 420);
    }
    function step() {
      if (finished) return;
      if (statusEl) statusEl.textContent = lines[i];
      if (barFill) barFill.style.width = Math.round(((i + 1) / lines.length) * 100) + '%';
      i++;
      if (i < lines.length) setTimeout(step, 480);
      else setTimeout(finish, 500);
    }
    if (skipBtn) skipBtn.addEventListener('click', finish);
    step();
  }

  /* ---------------------------------------------------------------------- */
  /* Voice FAB + global shortcut                                            */
  /* ---------------------------------------------------------------------- */
  function injectVoiceFab() {
    if (currentPage() === 'voice-console') return;
    if (document.getElementById('voice-fab')) return;
    var btn = document.createElement('a');
    btn.id = 'voice-fab';
    btn.className = 'voice-fab';
    btn.href = 'voice-console.html';
    btn.setAttribute('aria-label', 'Open Voice Console');
    btn.innerHTML = ICONS.mic;
    document.body.appendChild(btn);
  }

  function wireGlobalShortcut() {
    document.addEventListener('keydown', function (e) {
      if (e.altKey && e.shiftKey && e.code === 'KeyA') {
        e.preventDefault();
        window.location.href = 'voice-console.html';
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Helpers exposed to page scripts                                        */
  /* ---------------------------------------------------------------------- */
  function pct(consumed, target) { return target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0; }
  function statusFor(consumedPct) {
    if (consumedPct >= 95) return { cls: 'status-good', text: 'On track' };
    if (consumedPct >= 60) return { cls: 'status-info', text: 'In progress' };
    return { cls: 'status-warn', text: 'Behind' };
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Init                                                                   */
  /* ---------------------------------------------------------------------- */
  function init() {
    var page = currentPage();
    var guard = (Brain.Auth && Brain.Auth.guardPage) ? Brain.Auth.guardPage(page) : Promise.resolve(null);
    guard.then(function (session) {
      if (Brain.Auth && Brain.Auth.PUBLIC_PAGES.indexOf(page) === -1 && Brain.isSupabaseConfigured && !session) {
        return; // guardPage already redirected to login.html
      }
      Brain.session = session;
      applyTheme(State.data.settings.theme);
      renderSidebar();
      renderBottomNav();
      renderTopbar();
      renderGlobalModals();
      wireModalDismiss();
      wireHabitToggles(document);
      injectVoiceFab();
      wireGlobalShortcut();
      runBootSequence();
      var themeBtn = document.getElementById('theme-toggle-btn');
      if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
      document.dispatchEvent(new CustomEvent('lifeos:ready'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  Brain.App = {
    ICONS: ICONS,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    confirmAction: confirmAction,
    pct: pct,
    statusFor: statusFor,
    escapeHtml: escapeHtml,
    currentPage: currentPage,
    showSheet: showSheet
  };
})(window);
