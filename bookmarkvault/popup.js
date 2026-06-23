// BookmarkVault Popup

const $ = id => document.getElementById(id);

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $(`panel-${btn.dataset.panel}`).classList.add('active');
  });
});

function msg(action, extra = {}) {
  return chrome.runtime.sendMessage({ action, ...extra });
}

let pickedData = null;

function setStatus(elId, type, text) {
  const el = $(elId);
  el.className = `status ${type}`;
  el.textContent = text;
  if (type !== 'err') setTimeout(() => el.className = 'status', 6000);
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function getAndSaveKeys() {
  const masterKey = $('masterKeyInput').value.trim();
  const accessKey = $('accessKeyInput').value.trim();
  if (masterKey) await chrome.storage.local.set({ masterKey });
  if (accessKey) await chrome.storage.local.set({ accessKey });
  return { masterKey, accessKey };
}

function switchToPanel(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.nav-btn[data-panel="${name}"]`).classList.add('active');
  $(`panel-${name}`).classList.add('active');
}

// ── Folder picker ─────────────────────────────────────────────────
function countBookmarks(node) {
  if (!node) return 0;
  if (node.type === 'bookmark') return 1;
  return (node.children || []).reduce((a, c) => a + countBookmarks(c), 0);
}

function makeFolderItem(ri, ci, icon, title, count) {
  const item = document.createElement('label');
  item.className = 'folder-pick-item';

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = true;
  cb.className = 'folder-pick-cb';
  cb.dataset.ri = ri;
  cb.dataset.ci = ci;
  cb.addEventListener('change', updateFolderSummary);

  const iconEl = document.createElement('span');
  iconEl.className = 'folder-pick-icon';
  iconEl.textContent = icon;

  const nameEl = document.createElement('span');
  nameEl.className = 'folder-pick-name';
  nameEl.textContent = title;

  const countEl = document.createElement('span');
  countEl.className = 'folder-pick-count';
  countEl.textContent = `${count}`;

  item.appendChild(cb);
  item.appendChild(iconEl);
  item.appendChild(nameEl);
  item.appendChild(countEl);
  return item;
}

function showFolderPicker(data) {
  pickedData = data;
  const list = $('folderList');
  list.innerHTML = '';

  (data.roots || []).forEach((root, ri) => {
    const children = root.children || [];
    if (!children.length) return;

    const header = document.createElement('div');
    header.className = 'root-pick-label';
    header.textContent = root.title || `Section ${ri + 1}`;
    list.appendChild(header);

    // Loose bookmarks directly in this root (ci = -1)
    const loose = children.filter(c => c.type === 'bookmark');
    if (loose.length) {
      list.appendChild(makeFolderItem(ri, -1, '📎', 'Loose bookmarks', loose.length));
    }

    // Sub-folders
    children.forEach((child, ci) => {
      if (child.type !== 'folder') return;
      list.appendChild(makeFolderItem(ri, ci, '📁', child.title || 'Untitled', countBookmarks(child)));
    });
  });

  $('folderPickerSection').style.display = 'block';
  updateFolderSummary();
}

function updateFolderSummary() {
  let selected = 0, total = 0, bookmarkCount = 0;
  document.querySelectorAll('.folder-pick-item').forEach(item => {
    const cb = item.querySelector('.folder-pick-cb');
    const n = parseInt(item.querySelector('.folder-pick-count').textContent) || 0;
    total++;
    if (cb.checked) { selected++; bookmarkCount += n; }
  });
  $('pickSummary').textContent = `${selected}/${total} · ${bookmarkCount} bookmarks`;
}

// ── Init ──────────────────────────────────────────────────────────
async function init() {
  const res = await msg('collectBookmarks');
  if (res.ok) {
    $('bookmarkCount').textContent = `${res.data.totalCount} bookmarks`;
    $('statBookmarks').textContent = res.data.totalCount;
    let folders = 0;
    for (const root of (res.data.roots || [])) {
      folders += (root.children || []).filter(c => c.type === 'folder').length;
    }
    $('statFolders').textContent = folders;
    $('statRoots').textContent = (res.data.roots || []).length;
  }

  const s = await chrome.storage.local.get(['syncBinId', 'masterKey', 'accessKey', 'deviceName', 'lastSyncedAt']);
  if (s.syncBinId) { $('syncIdVal').textContent = s.syncBinId; $('syncIdDisplay').style.display = 'block'; $('pullBinId').value = s.syncBinId; }
  if (s.masterKey) $('masterKeyInput').value = s.masterKey;
  if (s.accessKey) $('accessKeyInput').value = s.accessKey;
  if (s.deviceName) $('deviceNameInput').value = s.deviceName;
  if (s.lastSyncedAt) $('lastSync').textContent = `Synced ${new Date(s.lastSyncedAt).toLocaleTimeString()}`;
}

// ── Export ────────────────────────────────────────────────────────
$('btnExportJSON').addEventListener('click', async () => {
  const res = await msg('exportJSON');
  if (!res.ok) return setStatus('exportStatus', 'err', 'Export failed');
  downloadFile(res.json, `bookmarkvault-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  setStatus('exportStatus', 'ok', '✓ Exported JSON');
});

$('btnExportHTML').addEventListener('click', async () => {
  const res = await msg('exportHTML');
  if (!res.ok) return setStatus('exportStatus', 'err', 'Export failed');
  downloadFile(res.html, `bookmarks-${new Date().toISOString().slice(0, 10)}.html`, 'text/html');
  setStatus('exportStatus', 'ok', '✓ Exported Netscape HTML (importable in any browser)');
});

// ── Sync — Save Keys ──────────────────────────────────────────────
$('btnSaveKeys').addEventListener('click', async () => {
  const masterKey = $('masterKeyInput').value.trim();
  const accessKey = $('accessKeyInput').value.trim();
  const toSave = {};
  if (masterKey) toSave.masterKey = masterKey;
  if (accessKey) toSave.accessKey = accessKey;
  if (!masterKey && !accessKey) return setStatus('syncStatus', 'err', '✗ Enter at least one key');
  await chrome.storage.local.set(toSave);
  setStatus('syncStatus', 'ok', '✓ Keys saved to storage');
});

// ── Sync — Push ───────────────────────────────────────────────────
$('btnPush').addEventListener('click', async () => {
  const { masterKey, accessKey } = await getAndSaveKeys();
  if (!masterKey) return setStatus('syncStatus', 'err', '✗ Master Key required. Enter it above and try again.');
  setStatus('syncStatus', 'info', '↑ Pushing bookmarks…');
  const res = await msg('syncPush', { masterKey, accessKey });
  if (!res.ok) return setStatus('syncStatus', 'err', `✗ ${res.error}`);
  $('syncIdVal').textContent = res.binId;
  $('syncIdDisplay').style.display = 'block';
  $('pullBinId').value = res.binId;
  $('lastSync').textContent = `Synced ${new Date().toLocaleTimeString()}`;
  setStatus('syncStatus', 'ok', `✓ Pushed ${res.data.totalCount} bookmarks! Bin ID: ${res.binId}`);
});

$('btnCopySyncId').addEventListener('click', () => {
  navigator.clipboard.writeText($('syncIdVal').textContent);
  $('btnCopySyncId').textContent = 'Copied!';
  setTimeout(() => $('btnCopySyncId').textContent = 'Copy', 1500);
});

// ── Sync — Pull ───────────────────────────────────────────────────
$('btnPull').addEventListener('click', async () => {
  const binId = $('pullBinId').value.trim();
  if (!binId) return setStatus('syncStatus', 'err', '✗ Enter a Sync ID (Bin ID)');
  const { masterKey, accessKey } = await getAndSaveKeys();
  setStatus('syncStatus', 'info', '↓ Pulling bookmarks…');
  const res = await msg('syncPull', { binId, masterKey, accessKey });
  if (!res.ok) return setStatus('syncStatus', 'err', `✗ ${res.error}`);
  const data = res.data;
  if (!data?.roots) return setStatus('syncStatus', 'err', '✗ Response did not contain bookmark data. Check Bin ID.');
  await chrome.storage.local.set({ pulledData: data });
  switchToPanel('import');
  showFolderPicker(data);
  setStatus('importStatus', 'ok', `✓ Pulled from "${data.device || 'Unknown'}" — select folders below`);
});

// ── Import — File picker ──────────────────────────────────────────
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsText(file);
  });
}

async function loadFile(file) {
  if (!file) return;
  try {
    const text = await readFileAsText(file);
    $('fileNameBadge').textContent = `📄 ${file.name}`;
    $('fileNameBadge').style.display = 'block';
    let data;
    try { data = JSON.parse(text); } catch { return setStatus('importStatus', 'err', '✗ File is not valid JSON'); }
    if (!data?.roots) return setStatus('importStatus', 'err', '✗ Not a valid BookmarkVault file');
    showFolderPicker(data);
    setStatus('importStatus', 'ok', `✓ Loaded "${file.name}" — select folders below`);
  } catch (e) {
    setStatus('importStatus', 'err', `✗ Could not read file: ${e.message}`);
  }
}

$('fileInput').addEventListener('change', e => { loadFile(e.target.files[0]); });

const dropZone = $('fileDropZone');
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

// ── Import — Parse paste ──────────────────────────────────────────
$('btnParseContent').addEventListener('click', async () => {
  const text = $('importText').value.trim();
  if (!text) return setStatus('importStatus', 'err', 'Paste JSON content first');
  let data;
  try { data = JSON.parse(text); } catch { return setStatus('importStatus', 'err', '✗ Invalid JSON'); }
  if (!data?.roots) return setStatus('importStatus', 'err', '✗ Not a valid BookmarkVault file');
  showFolderPicker(data);
  setStatus('importStatus', 'ok', 'Loaded — select folders below');
});

// ── Import — Folder picker actions ────────────────────────────────
$('btnSelectAll').addEventListener('click', () => {
  document.querySelectorAll('.folder-pick-cb').forEach(cb => { cb.checked = true; });
  updateFolderSummary();
});

$('btnSelectNone').addEventListener('click', () => {
  document.querySelectorAll('.folder-pick-cb').forEach(cb => { cb.checked = false; });
  updateFolderSummary();
});

$('btnImportSelected').addEventListener('click', async () => {
  if (!pickedData) return setStatus('importStatus', 'err', 'No data loaded');
  const selectedIndices = [];
  document.querySelectorAll('.folder-pick-cb').forEach(cb => {
    if (cb.checked) selectedIndices.push(`${cb.dataset.ri}-${cb.dataset.ci}`);
  });
  if (!selectedIndices.length) return setStatus('importStatus', 'err', '✗ Nothing selected');
  setStatus('importStatus', 'info', 'Importing bookmarks…');
  const res = await msg('importBookmarks', { data: pickedData, selectedIndices });
  if (!res.ok) return setStatus('importStatus', 'err', `✗ ${res.error}`);
  setStatus('importStatus', 'ok', `✓ Imported ${res.count} bookmarks → Other Bookmarks › BookmarkVault folder`);
});

$('btnImportAll').addEventListener('click', async () => {
  if (!pickedData) return setStatus('importStatus', 'err', 'No data loaded');
  setStatus('importStatus', 'info', 'Importing all bookmarks…');
  const res = await msg('importBookmarks', { data: pickedData, selectedIndices: null });
  if (!res.ok) return setStatus('importStatus', 'err', `✗ ${res.error}`);
  setStatus('importStatus', 'ok', `✓ Imported ${res.count} bookmarks → Other Bookmarks › BookmarkVault folder`);
});

// ── Settings ──────────────────────────────────────────────────────
$('btnSaveName').addEventListener('click', async () => {
  const name = $('deviceNameInput').value.trim();
  if (!name) return;
  await chrome.storage.local.set({ deviceName: name });
  setStatus('settingsStatus', 'ok', `✓ Device name: "${name}"`);
});

$('btnClearSync').addEventListener('click', async () => {
  await chrome.storage.local.remove(['syncBinId', 'masterKey', 'accessKey', 'pulledData', 'lastSyncedAt']);
  $('syncIdDisplay').style.display = 'none';
  $('syncIdVal').textContent = '—';
  $('pullBinId').value = '';
  $('masterKeyInput').value = '';
  $('accessKeyInput').value = '';
  $('lastSync').textContent = 'Never synced';
  setStatus('settingsStatus', 'ok', '✓ Cleared');
});

init();
