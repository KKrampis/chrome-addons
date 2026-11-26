// --- DOM refs ---
const privacyBtn   = document.getElementById('privacyBtn');
const optionsBtn   = document.getElementById('optionsBtn');
const libCount     = document.getElementById('libCount');
const captureTab   = document.getElementById('captureTab');
const libraryTab   = document.getElementById('libraryTab');
const notGoogleMsg = document.getElementById('notGoogleMsg');
const captureForm  = document.getElementById('captureForm');
const queryText    = document.getElementById('queryText');
const snapTitle    = document.getElementById('snapTitle');
const snapDesc     = document.getElementById('snapDesc');
const aiDetails    = document.getElementById('aiDetails');
const aiSummary    = document.getElementById('aiSummary');
const aiBody       = document.getElementById('aiBody');
const saveLocal    = document.getElementById('saveLocal');
const saveJsonbin  = document.getElementById('saveJsonbin');
const saveGithub   = document.getElementById('saveGithub');
const saveStatus   = document.getElementById('saveStatus');
const snapshotList = document.getElementById('snapshotList');
const emptyMsg     = document.getElementById('emptyMsg');
const exportJsonbin = document.getElementById('exportJsonbin');
const exportGithub  = document.getElementById('exportGithub');
const clearAll      = document.getElementById('clearAll');

let currentPageState = null;
let snapshots = [];
let privacyOn = false;

// --- Helpers ---
function strToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  const binStr = Array.from(bytes, b => String.fromCharCode(b)).join('');
  return btoa(binStr);
}

function base64ToStr(b64) {
  const binStr = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binStr, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function showStatus(msg, type = 'ok') {
  saveStatus.textContent = msg;
  saveStatus.className = 'status-line ' + type;
  saveStatus.hidden = false;
  setTimeout(() => { saveStatus.hidden = true; }, 4000);
}

function buildSnapshot() {
  return {
    id: Date.now().toString(),
    title: snapTitle.value.trim() || currentPageState.query,
    description: snapDesc.value.trim(),
    query: currentPageState.query,
    url: currentPageState.url,
    aiContent: currentPageState.aiContent,
    aiFound: currentPageState.aiFound,
    capturedAt: new Date().toISOString(),
  };
}

// --- Privacy mode ---
function applyPrivacyUI() {
  privacyBtn.classList.toggle('active', privacyOn);
  privacyBtn.title = privacyOn ? 'Privacy Shield: ON' : 'Privacy Shield: OFF';
}

privacyBtn.addEventListener('click', async () => {
  privacyOn = !privacyOn;
  applyPrivacyUI();
  await chrome.runtime.sendMessage({ type: 'AISV_SET_PRIVACY', enabled: privacyOn });
});

optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

// --- Tabs ---
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    captureTab.hidden = tab !== 'capture';
    libraryTab.hidden = tab !== 'library';
    if (tab === 'library') renderLibrary();
  });
});

// --- Capture tab ---
function populateCaptureTab(state) {
  if (!state || !state.query) {
    notGoogleMsg.hidden = false;
    captureForm.hidden = true;
    return;
  }
  notGoogleMsg.hidden = true;
  captureForm.hidden = false;

  queryText.textContent = state.query;
  snapTitle.value = state.query;

  if (state.aiFound && state.aiContent) {
    aiSummary.innerHTML = 'AI content <span class="found-badge">Found</span>';
    aiBody.textContent = state.aiContent.slice(0, 1200) + (state.aiContent.length > 1200 ? '…' : '');
  } else {
    aiSummary.innerHTML = 'AI content <span class="not-found">⚠ Not detected</span>';
    aiBody.textContent = 'No AI overview or AI Mode response was found on this page. Metadata and URL will still be saved.';
  }
}

// --- Save to storage ---
async function persistLocally(snap) {
  const { snapshots: saved = [] } = await chrome.storage.local.get('snapshots');
  saved.unshift(snap);
  await chrome.storage.local.set({ snapshots: saved });
  updateBadge(saved.length);
  return saved;
}

function updateBadge(n) {
  if (n > 0) { libCount.textContent = n; libCount.hidden = false; }
  else { libCount.hidden = true; }
}

// --- JSONbin ---
async function getJsonbinSettings() {
  return chrome.storage.sync.get(['jsonbinKey', 'jsonbinId']);
}

async function pushToJsonbin(snapsArray, settings) {
  const { jsonbinKey, jsonbinId } = settings;
  if (!jsonbinKey) throw new Error('No JSONbin API key — set it in Options.');

  const payload = JSON.stringify({ snapshots: snapsArray });
  if (jsonbinId) {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${jsonbinId}`, {
      method: 'PUT',
      headers: { 'X-Master-Key': jsonbinKey, 'Content-Type': 'application/json' },
      body: payload,
    });
    if (!res.ok) throw new Error(`JSONbin update failed: ${res.status}`);
    return jsonbinId;
  } else {
    const res = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'X-Master-Key': jsonbinKey,
        'X-Bin-Name': 'aisearch-vault',
        'Content-Type': 'application/json',
      },
      body: payload,
    });
    if (!res.ok) throw new Error(`JSONbin create failed: ${res.status}`);
    const data = await res.json();
    const newId = data.metadata.id;
    await chrome.storage.sync.set({ jsonbinId: newId });
    return newId;
  }
}

// --- GitHub ---
async function getGithubSettings() {
  return chrome.storage.sync.get(['githubToken', 'githubOwner', 'githubRepo', 'githubPath']);
}

async function pushToGithub(snapsArray, settings) {
  const { githubToken, githubOwner, githubRepo, githubPath } = settings;
  if (!githubToken || !githubOwner || !githubRepo) throw new Error('GitHub not configured — set it in Options.');
  const path = githubPath || 'aisearch-vault.json';
  const url = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${path}`;
  const headers = {
    Authorization: `token ${githubToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  let sha = undefined;
  const getRes = await fetch(url, { headers });
  if (getRes.ok) {
    const existing = await getRes.json();
    sha = existing.sha;
  }

  const content = strToBase64(JSON.stringify({ snapshots: snapsArray }, null, 2));
  const body = {
    message: `AISearch Vault: update snapshots (${snapsArray.length})`,
    content,
    ...(sha ? { sha } : {}),
  };
  const putRes = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.message || `GitHub push failed: ${putRes.status}`);
  }
}

// --- Save button handlers ---
saveLocal.addEventListener('click', async () => {
  const snap = buildSnapshot();
  await persistLocally(snap);
  showStatus('Saved locally.');
});

saveJsonbin.addEventListener('click', async () => {
  const snap = buildSnapshot();
  const all = await persistLocally(snap);
  try {
    const settings = await getJsonbinSettings();
    await pushToJsonbin(all, settings);
    showStatus('Saved locally + pushed to JSONbin.');
  } catch (e) {
    showStatus(e.message, 'err');
  }
});

saveGithub.addEventListener('click', async () => {
  const snap = buildSnapshot();
  const all = await persistLocally(snap);
  try {
    const settings = await getGithubSettings();
    await pushToGithub(all, settings);
    showStatus('Saved locally + pushed to GitHub.');
  } catch (e) {
    showStatus(e.message, 'err');
  }
});

// --- Library ---
function renderLibrary() {
  snapshotList.innerHTML = '';
  if (snapshots.length === 0) { emptyMsg.hidden = false; return; }
  emptyMsg.hidden = true;

  snapshots.forEach((snap, idx) => {
    const card = document.createElement('div');
    card.className = 'snap-card';
    card.dataset.id = snap.id;

    card.innerHTML = `
      <div class="snap-head">
        <span class="snap-title">${escHtml(snap.title)}</span>
        <span class="snap-date">${fmtDate(snap.capturedAt)}</span>
      </div>
      <div class="snap-query">Query: <span>${escHtml(snap.query)}</span></div>
      <div class="snap-actions">
        <button class="snap-btn edit-btn">Edit</button>
        <button class="snap-btn del">Delete</button>
      </div>
      <div class="snap-edit" hidden>
        <input type="text" class="edit-title" value="${escHtml(snap.title)}">
        <textarea class="edit-desc" rows="2">${escHtml(snap.description || '')}</textarea>
        <div class="snap-edit-actions">
          <button class="btn-save-edit">Save</button>
          <button class="btn-cancel-edit">Cancel</button>
        </div>
      </div>
    `;

    const editForm = card.querySelector('.snap-edit');
    card.querySelector('.edit-btn').addEventListener('click', () => {
      editForm.hidden = !editForm.hidden;
    });
    card.querySelector('.btn-cancel-edit').addEventListener('click', () => {
      editForm.hidden = true;
    });
    card.querySelector('.btn-save-edit').addEventListener('click', async () => {
      snap.title = card.querySelector('.edit-title').value.trim() || snap.query;
      snap.description = card.querySelector('.edit-desc').value.trim();
      snapshots[idx] = snap;
      await chrome.storage.local.set({ snapshots });
      renderLibrary();
    });
    card.querySelector('.del').addEventListener('click', async () => {
      snapshots.splice(idx, 1);
      await chrome.storage.local.set({ snapshots });
      updateBadge(snapshots.length);
      renderLibrary();
    });

    snapshotList.appendChild(card);
  });
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

exportJsonbin.addEventListener('click', async () => {
  if (snapshots.length === 0) return;
  try {
    const settings = await getJsonbinSettings();
    await pushToJsonbin(snapshots, settings);
    showStatus('All snapshots pushed to JSONbin.', 'ok');
  } catch (e) {
    showStatus(e.message, 'err');
  }
});

exportGithub.addEventListener('click', async () => {
  if (snapshots.length === 0) return;
  try {
    const settings = await getGithubSettings();
    await pushToGithub(snapshots, settings);
    showStatus('All snapshots pushed to GitHub.', 'ok');
  } catch (e) {
    showStatus(e.message, 'err');
  }
});

clearAll.addEventListener('click', async () => {
  if (!confirm('Delete all local snapshots?')) return;
  snapshots = [];
  await chrome.storage.local.set({ snapshots: [] });
  updateBadge(0);
  renderLibrary();
});

// --- Init ---
async function init() {
  // Load privacy state
  const { privacyMode = false } = await chrome.storage.sync.get('privacyMode');
  privacyOn = privacyMode;
  applyPrivacyUI();

  // Load local snapshots
  const { snapshots: saved = [] } = await chrome.storage.local.get('snapshots');
  snapshots = saved;
  updateBadge(snapshots.length);

  // Query content script on active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) { populateCaptureTab(null); return; }

  const isGoogleSearch = tab.url && /^https:\/\/www\.google\.com\/search/.test(tab.url);
  if (!isGoogleSearch) { populateCaptureTab(null); return; }

  try {
    const state = await chrome.tabs.sendMessage(tab.id, { type: 'AISV_GET_STATE' });
    currentPageState = state;
    populateCaptureTab(state);
  } catch {
    // Content script not yet injected
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      const state = await chrome.tabs.sendMessage(tab.id, { type: 'AISV_GET_STATE' });
      currentPageState = state;
      populateCaptureTab(state);
    } catch {
      populateCaptureTab({ query: new URL(tab.url).searchParams.get('q') || '', url: tab.url, aiContent: '', aiFound: false });
    }
  }
}

init();
