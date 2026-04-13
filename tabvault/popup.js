// TabVault Popup

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

// Always read keys from the DOM fields and persist them before any sync op
async function getAndSaveKeys() {
  const masterKey = $('masterKeyInput').value.trim();
  const accessKey = $('accessKeyInput').value.trim();
  if (masterKey) await chrome.storage.local.set({ masterKey });
  if (accessKey) await chrome.storage.local.set({ accessKey });
  return { masterKey, accessKey };
}

function setStatus(elId, type, text) {
  const el = $(elId);
  el.className = `status ${type}`;
  el.textContent = text;
  if (type !== 'err') setTimeout(() => el.className = 'status', 5000);
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Init ──────────────────────────────────────────────────────────
async function init() {
  const res = await msg('collectTabs');
  if (res.ok) {
    let tabs = 0, groups = 0;
    for (const w of res.data.windows) {
      groups += (w.groups || []).length;
      for (const g of (w.groups || [])) tabs += (g.tabs || []).length;
      tabs += (w.ungrouped || []).length;
    }
    $('tabCount').textContent = `${tabs} tabs`;
    $('statWindows').textContent = res.data.windows.length;
    $('statGroups').textContent = groups;
    $('statTabs').textContent = tabs;
  }

  const s = await chrome.storage.local.get(['syncBinId', 'masterKey', 'accessKey', 'deviceName', 'lastSyncedAt']);
  if (s.syncBinId)   { $('syncIdVal').textContent = s.syncBinId; $('syncIdDisplay').style.display = 'block'; $('pullBinId').value = s.syncBinId; }
  if (s.masterKey)   $('masterKeyInput').value = s.masterKey;
  if (s.accessKey)   $('accessKeyInput').value = s.accessKey;
  if (s.deviceName)  $('deviceNameInput').value = s.deviceName;
  if (s.lastSyncedAt) $('lastSync').textContent = `Synced ${new Date(s.lastSyncedAt).toLocaleTimeString()}`;
}

// ── Export ────────────────────────────────────────────────────────
$('btnExportYAML').addEventListener('click', async () => {
  const res = await msg('exportYAML');
  if (!res.ok) return setStatus('exportStatus', 'err', 'Export failed');
  downloadFile(res.yaml, `tabvault-${new Date().toISOString().slice(0,10)}.tabvault`, 'text/yaml');
  setStatus('exportStatus', 'ok', '✓ Exported');
});

$('btnExportJSON').addEventListener('click', async () => {
  const res = await msg('collectTabs');
  if (!res.ok) return setStatus('exportStatus', 'err', 'Export failed');
  downloadFile(JSON.stringify(res.data, null, 2), `tabvault-${new Date().toISOString().slice(0,10)}.json`, 'application/json');
  setStatus('exportStatus', 'ok', '✓ JSON exported');
});

$('btnOpenView').addEventListener('click', async () => { await msg('openTabView'); window.close(); });
$('footerViewBtn').addEventListener('click', async () => { await msg('openTabView'); window.close(); });

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
  if (!masterKey) {
    return setStatus('syncStatus', 'err',
      '✗ Master Key required. Enter it above and try again.');
  }
  setStatus('syncStatus', 'info', '↑ Pushing tabs…');
  const res = await msg('syncPush', { masterKey, accessKey });
  if (!res.ok) return setStatus('syncStatus', 'err', `✗ ${res.error}`);
  $('syncIdVal').textContent = res.binId;
  $('syncIdDisplay').style.display = 'block';
  $('pullBinId').value = res.binId;
  $('lastSync').textContent = `Synced ${new Date().toLocaleTimeString()}`;
  setStatus('syncStatus', 'ok', `✓ Pushed! Bin ID: ${res.binId}`);
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
  setStatus('syncStatus', 'info', '↓ Pulling tabs…');
  const res = await msg('syncPull', { binId, masterKey, accessKey });
  if (!res.ok) return setStatus('syncStatus', 'err', `✗ ${res.error}`);

  const data = res.data;
  if (!data?.windows) return setStatus('syncStatus', 'err', '✗ Response did not contain tab data. Check Bin ID.');

  let tabs = 0;
  for (const w of (data.windows || [])) {
    for (const g of (w.groups || [])) tabs += (g.tabs || []).length;
    tabs += (w.ungrouped || []).length;
  }

  await chrome.storage.local.set({ pulledData: data });
  setStatus('syncStatus', 'ok',
    `✓ Pulled ${tabs} tabs from "${data.device || 'Unknown'}"\nGo to Import → Open All to open them`);
});

// ── Import — File picker ─────────────────────────────────────────
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
    $('importText').value = text;
    $('fileNameBadge').textContent = `📄 ${file.name}`;
    $('fileNameBadge').style.display = 'block';
    setStatus('importStatus', 'ok', `✓ Loaded "${file.name}" — click Open to import`);
  } catch (e) {
    setStatus('importStatus', 'err', `✗ Could not read file: ${e.message}`);
  }
}

$('fileInput').addEventListener('change', e => {
  loadFile(e.target.files[0]);
});

// Drag-and-drop
const dropZone = $('fileDropZone');
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

// ── Import — Open/Preview ─────────────────────────────────────────
$('btnImportOpen').addEventListener('click', async () => {
  const text = $('importText').value.trim();

  if (!text) {
    const s = await chrome.storage.local.get('pulledData');
    if (s.pulledData) {
      const res = await msg('importTabs', { data: s.pulledData });
      return setStatus('importStatus', 'ok', `✓ Opening ${res.count} tabs…`);
    }
    return setStatus('importStatus', 'err', 'Paste YAML/JSON or pull from Sync first');
  }

  let data;
  try { data = JSON.parse(text); }
  catch {
    const res = await msg('parseYAML', { yaml: text });
    if (!res.ok || !res.data) return setStatus('importStatus', 'err', '✗ Could not parse content');
    data = res.data;
  }

  const res = await msg('importTabs', { data });
  if (!res.ok) return setStatus('importStatus', 'err', `✗ ${res.error}`);
  setStatus('importStatus', 'ok', `✓ Opening ${res.count} tabs…`);
});

$('btnImportPreview').addEventListener('click', async () => {
  const text = $('importText').value.trim();
  if (!text) return setStatus('importStatus', 'err', 'Nothing to preview');
  let data;
  try { data = JSON.parse(text); }
  catch {
    const res = await msg('parseYAML', { yaml: text });
    if (!res.ok || !res.data) return setStatus('importStatus', 'err', '✗ Parse failed');
    data = res.data;
  }
  let tabs = 0, groups = 0;
  for (const w of (data.windows || [])) {
    groups += (w.groups || []).length;
    for (const g of (w.groups || [])) tabs += (g.tabs || []).length;
    tabs += (w.ungrouped || []).length;
  }
  setStatus('importStatus', 'ok',
    `${data.windows?.length || 0} windows · ${groups} groups · ${tabs} tabs\nFrom: "${data.device || 'Unknown'}"`);
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
