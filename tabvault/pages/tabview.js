// TabVault - Tab Visualizer Page Script

// ── Helpers ───────────────────────────────────────────────────────
function msg(action, extra = {}) {
  return chrome.runtime.sendMessage({ action, ...extra });
}

function showToast(text, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function getColorClass(color) {
  const map = {
    blue: 'blue', red: 'red', yellow: 'yellow', green: 'green',
    pink: 'pink', purple: 'purple', cyan: 'cyan', orange: 'orange',
    grey: 'grey', gray: 'grey'
  };
  return map[color?.toLowerCase()] || 'grey';
}

function faviconUrl(favIconUrl, url) {
  if (favIconUrl && !favIconUrl.startsWith('chrome')) return favIconUrl;
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch { return null; }
}

function escHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Render ────────────────────────────────────────────────────────
function renderTabs(data) {
  const main = document.getElementById('mainContent');

  let totalTabs = 0, totalGroups = 0;
  for (const win of data.windows) {
    totalGroups += (win.groups || []).length;
    for (const grp of (win.groups || [])) totalTabs += (grp.tabs || []).length;
    totalTabs += (win.ungrouped || []).length;
  }

  document.getElementById('topbarStats').innerHTML =
    `<span class="topbar-stat"><b>${data.windows.length}</b> windows</span>
     <span class="topbar-stat"><b>${totalGroups}</b> groups</span>
     <span class="topbar-stat"><b>${totalTabs}</b> tabs</span>
     <span class="topbar-stat" style="color:var(--text2);font-size:11px;">${escHtml(data.device || '')}</span>`;

  main.innerHTML = '';

  for (let wi = 0; wi < data.windows.length; wi++) {
    const win = data.windows[wi];
    const section = document.createElement('div');
    section.className = 'window-section';

    const groupCount = (win.groups || []).length;
    const ungroupedCount = (win.ungrouped || []).length;

    // Window header
    const header = document.createElement('div');
    header.className = 'window-header';
    header.innerHTML =
      `<span class="window-label">${escHtml(win.label || `Window ${wi + 1}`)}</span>
       <div class="window-line"></div>
       <span class="window-count">${groupCount} groups · ${ungroupedCount} ungrouped</span>`;
    section.appendChild(header);

    // Groups grid
    if (groupCount > 0) {
      const grid = document.createElement('div');
      grid.className = 'groups-grid';

      for (const grp of (win.groups || [])) {
        const colorClass = getColorClass(grp.color);
        const card = document.createElement('div');
        card.className = `group-card border-${colorClass}${grp.collapsed ? ' collapsed' : ''}`;

        const cardHeader = document.createElement('div');
        cardHeader.className = 'group-header';
        cardHeader.innerHTML =
          `<div class="group-color-dot color-${colorClass}"></div>
           <span class="group-title">${escHtml(grp.title || 'Unnamed')}</span>
           <span class="group-tab-count">${(grp.tabs || []).length}</span>
           <span class="group-toggle">▼</span>`;

        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'group-tabs';

        for (let ti = 0; ti < (grp.tabs || []).length; ti++) {
          tabsContainer.appendChild(buildTabRow(grp.tabs[ti]));
        }

        cardHeader.addEventListener('click', () => card.classList.toggle('collapsed'));

        card.appendChild(cardHeader);
        card.appendChild(tabsContainer);
        grid.appendChild(card);
      }

      section.appendChild(grid);
    }

    // Ungrouped tabs
    if (ungroupedCount > 0) {
      const ugSection = document.createElement('div');
      ugSection.className = 'ungrouped-section';

      const ugHeader = document.createElement('div');
      ugHeader.className = 'ungrouped-header';
      ugHeader.innerHTML =
        `<span class="ungrouped-label">Ungrouped</span>
         <span class="ungrouped-count">${ungroupedCount}</span>
         <div class="ungrouped-line"></div>
         <span class="ungrouped-toggle">▼</span>`;

      const ugGrid = document.createElement('div');
      ugGrid.className = 'ungrouped-grid';

      for (let ti = 0; ti < (win.ungrouped || []).length; ti++) {
        ugGrid.appendChild(buildTabRow(win.ungrouped[ti]));
      }

      ugHeader.addEventListener('click', () => ugSection.classList.toggle('collapsed'));

      ugSection.appendChild(ugHeader);
      ugSection.appendChild(ugGrid);
      section.appendChild(ugSection);
    }

    main.appendChild(section);
  }

  // Stagger animations
  document.querySelectorAll('.group-card').forEach((el, i) => {
    el.style.animationDelay = `${i * 30}ms`;
  });
}

function buildTabRow(tab) {
  const row = document.createElement('div');
  row.className = 'tab-row';
  row.dataset.url = tab.url || '';
  row.dataset.title = (tab.title || '').toLowerCase();

  const fav = faviconUrl(tab.favIconUrl, tab.url);

  const favEl = document.createElement(fav ? 'img' : 'div');
  if (fav) {
    favEl.className = 'tab-favicon';
    favEl.src = fav;
    favEl.alt = '';
    favEl.addEventListener('error', () => { favEl.style.display = 'none'; });
  } else {
    favEl.className = 'tab-favicon-placeholder';
    favEl.textContent = '🌐';
  }

  let domain = '';
  try { domain = new URL(tab.url).hostname; } catch {}

  const info = document.createElement('div');
  info.className = 'tab-info';
  info.innerHTML =
    `<div class="tab-title">${escHtml(tab.title || 'Untitled')}</div>
     <div class="tab-url">${escHtml(domain)}</div>`;

  const goBtn = document.createElement('span');
  goBtn.className = 'tab-goto';
  goBtn.textContent = '→ go';

  row.appendChild(favEl);
  row.appendChild(info);
  if (tab.pinned) {
    const pin = document.createElement('span');
    pin.className = 'tab-pinned';
    pin.textContent = '📌';
    row.appendChild(pin);
  }
  row.appendChild(goBtn);

  row.addEventListener('click', async () => {
    if (!tab.url || !tab.url.startsWith('http')) return;
    const res = await msg('focusTab', { url: tab.url });
    if (res && res.found) {
      showToast(`Switched to: ${tab.title}`, 'ok');
    } else {
      chrome.tabs.create({ url: tab.url });
      showToast(`Opening: ${tab.title}`, 'info');
    }
  });

  return row;
}

// ── Search ────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll('.tab-row').forEach(row => {
    const match = !q ||
      row.dataset.title.includes(q) ||
      row.dataset.url.toLowerCase().includes(q);
    row.classList.toggle('hidden', !match);
    row.classList.toggle('highlight', !!q && match);
  });
});

// ── Collapse / Expand ─────────────────────────────────────────────
document.getElementById('btnCollapseAll').addEventListener('click', () => {
  document.querySelectorAll('.group-card').forEach(c => c.classList.add('collapsed'));
  document.querySelectorAll('.ungrouped-section').forEach(s => s.classList.add('collapsed'));
});

document.getElementById('btnExpandAll').addEventListener('click', () => {
  document.querySelectorAll('.group-card').forEach(c => c.classList.remove('collapsed'));
  document.querySelectorAll('.ungrouped-section').forEach(s => s.classList.remove('collapsed'));
});

// ── Refresh ───────────────────────────────────────────────────────
document.getElementById('btnRefresh').addEventListener('click', loadTabs);

async function loadTabs() {
  document.getElementById('mainContent').innerHTML =
    `<div class="loading">
       <div class="loading-spinner"></div>
       <div class="loading-text">Loading your tabs...</div>
     </div>`;

  const res = await msg('collectTabs');
  if (res && res.ok) {
    renderTabs(res.data);
  } else {
    document.getElementById('mainContent').innerHTML =
      `<div class="empty">Failed to load tabs. Try refreshing.</div>`;
  }
}

// ── Theme Picker ─────────────────────────────────────────────────
// Swatch preview colours for each theme (bg, surface, accent)
const SWATCH_COLORS = {
  'dark-space':      ['#080a0f', '#141a24', '#4f7eff'],
  'dark-midnight':   ['#0a0a0f', '#16161f', '#818cf8'],
  'dark-forest':     ['#080f0a', '#121d16', '#4ade80'],
  'dark-ember':      ['#0f0805', '#21140a', '#fb923c'],
  'dark-ocean':      ['#030d18', '#0a1f33', '#22d3ee'],
  'dark-void':       ['#000000', '#111111', '#ffffff'],
  'dark-sakura':     ['#0f080f', '#221222', '#f472b6'],
  'dark-nord':       ['#1a1e2e', '#252b3e', '#88c0d0'],
  'dark-dracula':    ['#181a27', '#252840', '#bd93f9'],
  'dark-mocha':      ['#11100f', '#231f1a', '#d4a96a'],
  'light-paper':     ['#f8f7f4', '#f1efe9', '#2563eb'],
  'light-sky':       ['#f0f7ff', '#e8f1fb', '#0284c7'],
  'light-rose':      ['#fff5f7', '#fce8ec', '#e11d48'],
  'light-sand':      ['#faf6f0', '#f2ece2', '#b45309'],
  'light-mint':      ['#f0faf4', '#e2f5ea', '#059669'],
  'light-lavender':  ['#f5f3ff', '#ede9fe', '#7c3aed'],
  'light-cream':     ['#fdfaf5', '#f7f1e4', '#92400e'],
  'light-slate':     ['#f1f5f9', '#e8edf5', '#475569'],
};

async function initThemePicker() {
  const dropdown = document.getElementById('themeDropdown');
  const trigger  = document.getElementById('themeMenuTrigger');
  const label    = document.getElementById('themeLabel');

  const themes = window.TABVAULT_THEMES;

  // Build sections
  const darkIds  = Object.keys(themes).filter(id => themes[id].dark);
  const lightIds = Object.keys(themes).filter(id => !themes[id].dark);

  function makeSection(ids, sectionLabel) {
    const lbl = document.createElement('div');
    lbl.className = 'theme-section-label';
    lbl.textContent = sectionLabel;
    dropdown.appendChild(lbl);

    for (const id of ids) {
      const theme = themes[id];
      const colors = SWATCH_COLORS[id] || ['#333', '#555', '#4f7eff'];

      const swatch = document.createElement('div');
      swatch.className = 'theme-swatch';
      swatch.dataset.theme = id;

      const preview = document.createElement('div');
      preview.className = 'swatch-preview';
      colors.forEach(c => {
        const dot = document.createElement('div');
        dot.className = 'swatch-dot';
        dot.style.background = c;
        preview.appendChild(dot);
      });

      const lbl2 = document.createElement('span');
      lbl2.className = 'swatch-label';
      lbl2.textContent = theme.label;

      const emoji = document.createElement('span');
      emoji.className = 'swatch-emoji';
      emoji.textContent = theme.emoji;

      const activeDot = document.createElement('div');
      activeDot.className = 'swatch-active-dot';

      swatch.appendChild(preview);
      swatch.appendChild(lbl2);
      swatch.appendChild(emoji);
      swatch.appendChild(activeDot);

      swatch.addEventListener('click', async () => {
        window.applyTheme(id);
        await window.saveTheme(id);
        label.textContent = theme.label;
        dropdown.classList.remove('open');
      });

      dropdown.appendChild(swatch);
    }
  }

  makeSection(darkIds, '🌙 Dark');
  makeSection(lightIds, '☀️ Light');

  // Toggle dropdown
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));
  dropdown.addEventListener('click', e => e.stopPropagation());

  // Load & apply saved/auto theme
  const activeId = await window.loadTheme();
  if (themes[activeId]) {
    label.textContent = themes[activeId].label;
  }
}

// ── Boot ──────────────────────────────────────────────────────────
initThemePicker();
loadTabs();
