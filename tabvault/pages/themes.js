// TabVault — Theme System

const THEMES = {
  // ── Dark ─────────────────────────────────────────────────────────
  'dark-space': {
    label: 'Space', dark: true, emoji: '🌌',
    vars: { '--bg':'#080a0f','--surface':'#0e1118','--surface2':'#141a24','--surface3':'#1c2333','--border':'#1f2a3d','--border2':'#2a3a54','--accent':'#4f7eff','--accent2':'#a78bfa','--green':'#2dd4a7','--yellow':'#fbbf24','--red':'#f87171','--text':'#dde4f0','--text2':'#8899bb','--grid-color':'rgba(79,126,255,0.04)','--topbar-bg':'rgba(8,10,15,0.92)' }
  },
  'dark-midnight': {
    label: 'Midnight', dark: true, emoji: '🌙',
    vars: { '--bg':'#0a0a0f','--surface':'#101018','--surface2':'#16161f','--surface3':'#1e1e2a','--border':'#252535','--border2':'#323248','--accent':'#818cf8','--accent2':'#c084fc','--green':'#34d399','--yellow':'#fcd34d','--red':'#fb7185','--text':'#e2e8f0','--text2':'#7c8aad','--grid-color':'rgba(129,140,248,0.04)','--topbar-bg':'rgba(10,10,15,0.92)' }
  },
  'dark-forest': {
    label: 'Forest', dark: true, emoji: '🌲',
    vars: { '--bg':'#080f0a','--surface':'#0d1510','--surface2':'#121d16','--surface3':'#182619','--border':'#1e3022','--border2':'#27402c','--accent':'#4ade80','--accent2':'#86efac','--green':'#34d399','--yellow':'#fbbf24','--red':'#f87171','--text':'#d1fae5','--text2':'#6b9e7a','--grid-color':'rgba(74,222,128,0.04)','--topbar-bg':'rgba(8,15,10,0.92)' }
  },
  'dark-ember': {
    label: 'Ember', dark: true, emoji: '🔥',
    vars: { '--bg':'#0f0805','--surface':'#180f08','--surface2':'#21140a','--surface3':'#2c1b0e','--border':'#3d2410','--border2':'#54310f','--accent':'#fb923c','--accent2':'#f97316','--green':'#4ade80','--yellow':'#fbbf24','--red':'#f87171','--text':'#fef3c7','--text2':'#a07040','--grid-color':'rgba(251,146,60,0.05)','--topbar-bg':'rgba(15,8,5,0.92)' }
  },
  'dark-ocean': {
    label: 'Ocean', dark: true, emoji: '🌊',
    vars: { '--bg':'#030d18','--surface':'#061524','--surface2':'#0a1f33','--surface3':'#0e2a44','--border':'#103550','--border2':'#164a6e','--accent':'#22d3ee','--accent2':'#67e8f9','--green':'#34d399','--yellow':'#fbbf24','--red':'#f87171','--text':'#e0f2fe','--text2':'#5a9cbf','--grid-color':'rgba(34,211,238,0.04)','--topbar-bg':'rgba(3,13,24,0.93)' }
  },
  'dark-void': {
    label: 'Void', dark: true, emoji: '⬛',
    vars: { '--bg':'#000000','--surface':'#0a0a0a','--surface2':'#111111','--surface3':'#1a1a1a','--border':'#222222','--border2':'#333333','--accent':'#ffffff','--accent2':'#aaaaaa','--green':'#4ade80','--yellow':'#fbbf24','--red':'#f87171','--text':'#eeeeee','--text2':'#666666','--grid-color':'rgba(255,255,255,0.03)','--topbar-bg':'rgba(0,0,0,0.95)' }
  },
  'dark-sakura': {
    label: 'Sakura Night', dark: true, emoji: '🌸',
    vars: { '--bg':'#0f080f','--surface':'#180d18','--surface2':'#221222','--surface3':'#2c1a2c','--border':'#3d1f3d','--border2':'#5a2d5a','--accent':'#f472b6','--accent2':'#e879f9','--green':'#34d399','--yellow':'#fbbf24','--red':'#f87171','--text':'#fce7f3','--text2':'#9f6b8a','--grid-color':'rgba(244,114,182,0.05)','--topbar-bg':'rgba(15,8,15,0.93)' }
  },
  'dark-nord': {
    label: 'Nord', dark: true, emoji: '❄️',
    vars: { '--bg':'#1a1e2e','--surface':'#1e2336','--surface2':'#252b3e','--surface3':'#2e3650','--border':'#373f58','--border2':'#434d6a','--accent':'#88c0d0','--accent2':'#81a1c1','--green':'#a3be8c','--yellow':'#ebcb8b','--red':'#bf616a','--text':'#eceff4','--text2':'#7b88a8','--grid-color':'rgba(136,192,208,0.04)','--topbar-bg':'rgba(26,30,46,0.93)' }
  },
  'dark-dracula': {
    label: 'Dracula', dark: true, emoji: '🧛',
    vars: { '--bg':'#181a27','--surface':'#1e2030','--surface2':'#252840','--surface3':'#2d3152','--border':'#363a5a','--border2':'#434870','--accent':'#bd93f9','--accent2':'#ff79c6','--green':'#50fa7b','--yellow':'#f1fa8c','--red':'#ff5555','--text':'#f8f8f2','--text2':'#6272a4','--grid-color':'rgba(189,147,249,0.04)','--topbar-bg':'rgba(24,26,39,0.93)' }
  },
  'dark-mocha': {
    label: 'Mocha', dark: true, emoji: '☕',
    vars: { '--bg':'#11100f','--surface':'#1a1713','--surface2':'#231f1a','--surface3':'#2e2820','--border':'#3d3428','--border2':'#524638','--accent':'#d4a96a','--accent2':'#e8c99a','--green':'#a8c77f','--yellow':'#e8b86d','--red':'#e07070','--text':'#f0e6d3','--text2':'#8a7560','--grid-color':'rgba(212,169,106,0.05)','--topbar-bg':'rgba(17,16,15,0.93)' }
  },

  // ── Light ─────────────────────────────────────────────────────────
  'light-paper': {
    label: 'Paper', dark: false, emoji: '📄',
    vars: { '--bg':'#f8f7f4','--surface':'#ffffff','--surface2':'#f1efe9','--surface3':'#e8e5dc','--border':'#d4d0c4','--border2':'#bbb6a8','--accent':'#2563eb','--accent2':'#7c3aed','--green':'#059669','--yellow':'#d97706','--red':'#dc2626','--text':'#1c1917','--text2':'#6b6860','--grid-color':'rgba(37,99,235,0.04)','--topbar-bg':'rgba(248,247,244,0.95)' }
  },
  'light-sky': {
    label: 'Sky', dark: false, emoji: '☁️',
    vars: { '--bg':'#f0f7ff','--surface':'#ffffff','--surface2':'#e8f1fb','--surface3':'#dceaf7','--border':'#c0d9f0','--border2':'#a3c4e8','--accent':'#0284c7','--accent2':'#7c3aed','--green':'#059669','--yellow':'#d97706','--red':'#dc2626','--text':'#0c1a2e','--text2':'#4a6580','--grid-color':'rgba(2,132,199,0.05)','--topbar-bg':'rgba(240,247,255,0.95)' }
  },
  'light-rose': {
    label: 'Rose', dark: false, emoji: '🌹',
    vars: { '--bg':'#fff5f7','--surface':'#ffffff','--surface2':'#fce8ec','--surface3':'#f8d7de','--border':'#f0bcc8','--border2':'#e8a0b0','--accent':'#e11d48','--accent2':'#9333ea','--green':'#059669','--yellow':'#d97706','--red':'#dc2626','--text':'#1c0a0e','--text2':'#7c4a56','--grid-color':'rgba(225,29,72,0.04)','--topbar-bg':'rgba(255,245,247,0.95)' }
  },
  'light-sand': {
    label: 'Sand', dark: false, emoji: '🏜️',
    vars: { '--bg':'#faf6f0','--surface':'#ffffff','--surface2':'#f2ece2','--surface3':'#e8dfd0','--border':'#d4c9b5','--border2':'#c0b09a','--accent':'#b45309','--accent2':'#92400e','--green':'#059669','--yellow':'#d97706','--red':'#dc2626','--text':'#1c1309','--text2':'#796550','--grid-color':'rgba(180,83,9,0.04)','--topbar-bg':'rgba(250,246,240,0.95)' }
  },
  'light-mint': {
    label: 'Mint', dark: false, emoji: '🌿',
    vars: { '--bg':'#f0faf4','--surface':'#ffffff','--surface2':'#e2f5ea','--surface3':'#d0eddb','--border':'#b0dfc0','--border2':'#90cfa8','--accent':'#059669','--accent2':'#0d9488','--green':'#059669','--yellow':'#d97706','--red':'#dc2626','--text':'#0a1f14','--text2':'#437a56','--grid-color':'rgba(5,150,105,0.05)','--topbar-bg':'rgba(240,250,244,0.95)' }
  },
  'light-lavender': {
    label: 'Lavender', dark: false, emoji: '💜',
    vars: { '--bg':'#f5f3ff','--surface':'#ffffff','--surface2':'#ede9fe','--surface3':'#ddd6fe','--border':'#c4b5fd','--border2':'#a78bfa','--accent':'#7c3aed','--accent2':'#6d28d9','--green':'#059669','--yellow':'#d97706','--red':'#dc2626','--text':'#1e1040','--text2':'#6d5a9e','--grid-color':'rgba(124,58,237,0.05)','--topbar-bg':'rgba(245,243,255,0.95)' }
  },
  'light-cream': {
    label: 'Cream', dark: false, emoji: '🍦',
    vars: { '--bg':'#fdfaf5','--surface':'#ffffff','--surface2':'#f7f1e4','--surface3':'#f0e8d2','--border':'#e0d4b8','--border2':'#cfc09e','--accent':'#92400e','--accent2':'#b45309','--green':'#065f46','--yellow':'#92400e','--red':'#991b1b','--text':'#1c1409','--text2':'#78624a','--grid-color':'rgba(146,64,14,0.04)','--topbar-bg':'rgba(253,250,245,0.95)' }
  },
  'light-slate': {
    label: 'Slate', dark: false, emoji: '🪨',
    vars: { '--bg':'#f1f5f9','--surface':'#ffffff','--surface2':'#e8edf5','--surface3':'#dce3ee','--border':'#c4cedc','--border2':'#a8b6c8','--accent':'#475569','--accent2':'#334155','--green':'#059669','--yellow':'#d97706','--red':'#dc2626','--text':'#0f172a','--text2':'#5a6a80','--grid-color':'rgba(71,85,105,0.05)','--topbar-bg':'rgba(241,245,249,0.95)' }
  },
};

const AUTO_DARK  = 'dark-space';
const AUTO_LIGHT = 'light-paper';
const STORAGE_KEY = 'tabvaultTheme';

function applyTheme(id) {
  const theme = THEMES[id];
  if (!theme) return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
  document.documentElement.dataset.theme = id;
  document.documentElement.dataset.dark = theme.dark ? '1' : '0';
  const topbar = document.querySelector('.topbar');
  if (topbar) topbar.style.background = theme.vars['--topbar-bg'];
  updateGridColor(theme.vars['--grid-color']);
  document.querySelectorAll('.theme-swatch').forEach(s => s.classList.toggle('active', s.dataset.theme === id));
}

function updateGridColor(color) {
  let el = document.getElementById('dynamic-grid-style');
  if (!el) { el = document.createElement('style'); el.id = 'dynamic-grid-style'; document.head.appendChild(el); }
  el.textContent = `body::before { background-image: linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px); background-size: 40px 40px; }`;
}

async function loadTheme() {
  let saved = null;
  try { const res = await chrome.storage.local.get(STORAGE_KEY); saved = res[STORAGE_KEY] || null; }
  catch { saved = localStorage.getItem(STORAGE_KEY); }
  if (saved && THEMES[saved]) { applyTheme(saved); return saved; }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const autoId = prefersDark ? AUTO_DARK : AUTO_LIGHT;
  applyTheme(autoId);
  return autoId;
}

async function saveTheme(id) {
  try { await chrome.storage.local.set({ [STORAGE_KEY]: id }); }
  catch { localStorage.setItem(STORAGE_KEY, id); }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async e => {
  let saved = null;
  try { const res = await chrome.storage.local.get(STORAGE_KEY); saved = res[STORAGE_KEY] || null; }
  catch { saved = localStorage.getItem(STORAGE_KEY); }
  if (!saved) applyTheme(e.matches ? AUTO_DARK : AUTO_LIGHT);
});

window.TABVAULT_THEMES = THEMES;
window.applyTheme = applyTheme;
window.loadTheme = loadTheme;
window.saveTheme = saveTheme;
