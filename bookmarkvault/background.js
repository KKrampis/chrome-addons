// BookmarkVault — Background Service Worker

const JSONBIN_BASE = "https://api.jsonbin.io/v3/b";
const FORMAT_VERSION = "1.0";

// ── Helpers ───────────────────────────────────────────────────────
async function getDeviceName() {
  const s = await chrome.storage.local.get("deviceName");
  return s.deviceName || "My Browser";
}

async function getKeys(overrides = {}) {
  const s = await chrome.storage.local.get(["masterKey", "accessKey"]);
  const masterKey = (overrides.masterKey || "").trim() || (s.masterKey || "").trim();
  const accessKey = (overrides.accessKey || "").trim() || (s.accessKey || "").trim();
  return { masterKey, accessKey };
}

// ── Bookmark Collection ───────────────────────────────────────────
function serializeNode(node) {
  if (node.url) {
    return { type: "bookmark", title: node.title || "", url: node.url };
  }
  return {
    type: "folder",
    title: node.title || "Untitled",
    children: (node.children || []).map(serializeNode),
  };
}

function countInNode(node) {
  if (!node) return 0;
  if (node.type === "bookmark") return 1;
  return (node.children || []).reduce((a, c) => a + countInNode(c), 0);
}

async function collectBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  const roots = (tree[0]?.children || []).map(serializeNode);
  const totalCount = roots.reduce((a, r) => a + countInNode(r), 0);
  return {
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    device: await getDeviceName(),
    totalCount,
    roots,
  };
}

// ── Netscape HTML Export ──────────────────────────────────────────
function escAttr(s) { return (s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }
function escHtml(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function nodeToNetscape(node, depth) {
  const pad = "    ".repeat(depth);
  if (node.type === "bookmark") {
    return `${pad}<DT><A HREF="${escAttr(node.url)}">${escHtml(node.title)}</A>`;
  }
  const lines = [
    `${pad}<DT><H3>${escHtml(node.title)}</H3>`,
    `${pad}<DL><p>`,
    ...(node.children || []).map(c => nodeToNetscape(c, depth + 1)),
    `${pad}</DL><p>`,
  ];
  return lines.join("\n");
}

function toNetscapeHTML(data) {
  return [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    `<!-- BookmarkVault Export — ${data.exportedAt} — Device: ${data.device} -->`,
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
    ...(data.roots || []).map(r => nodeToNetscape(r, 1)),
    "</DL><p>",
  ].join("\n");
}

// ── JSONBin Sync ──────────────────────────────────────────────────
async function syncPush(binId, keyOverrides = {}) {
  const { masterKey } = await getKeys(keyOverrides);
  if (!masterKey) throw new Error("Master Key required. Add it in the Sync panel.");

  const data = await collectBookmarks();
  const isUpdate = !!binId;
  const url = isUpdate ? `${JSONBIN_BASE}/${binId}` : JSONBIN_BASE;
  const method = isUpdate ? "PUT" : "POST";

  const headers = { "Content-Type": "application/json", "X-Master-Key": masterKey };
  if (!isUpdate) {
    headers["X-Bin-Name"] = `BookmarkVault-${data.device}`;
    headers["X-Bin-Private"] = "true";
  }

  const res = await fetch(url, { method, headers, body: JSON.stringify({ bookmarkvault: data }) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Push ${res.status}: ${body || res.statusText}`);
  }

  const json = await res.json();
  const newBinId = json.metadata?.id || binId;
  await chrome.storage.local.set({ syncBinId: newBinId, lastSyncedAt: new Date().toISOString() });
  return { binId: newBinId, data };
}

async function syncPull(binId, keyOverrides = {}) {
  if (!binId) throw new Error("No Sync ID provided.");

  const { masterKey, accessKey } = await getKeys(keyOverrides);
  const headers = { "X-Bin-Meta": "false" };
  if (masterKey) headers["X-Master-Key"] = masterKey;
  else if (accessKey) headers["X-Access-Key"] = accessKey;

  const res = await fetch(`${JSONBIN_BASE}/${binId}`, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Pull ${res.status}: ${body || res.statusText}`);
  }

  const json = await res.json();
  const record = json.record ?? json;
  return record.bookmarkvault ?? record;
}

// ── Import ────────────────────────────────────────────────────────
async function importNode(node, parentId) {
  if (node.type === "bookmark") {
    if (!node.url?.startsWith("http")) return 0;
    try {
      await chrome.bookmarks.create({ parentId, title: node.title || "Untitled", url: node.url });
      return 1;
    } catch { return 0; }
  }
  let folder;
  try {
    folder = await chrome.bookmarks.create({ parentId, title: node.title || "Untitled" });
  } catch { return 0; }
  let count = 0;
  for (const child of (node.children || [])) count += await importNode(child, folder.id);
  return count;
}

// selectedIndices: string[] of "ri-ci" keys, or null to import everything.
// ci === -1 is the special key for loose (ungrouped) bookmarks directly in a root.
async function importBookmarks(data, selectedIndices) {
  const selectedSet = selectedIndices ? new Set(selectedIndices) : null;

  // Place everything under a dated import folder in Other Bookmarks (id "2")
  const importFolder = await chrome.bookmarks.create({
    parentId: "2",
    title: `BookmarkVault — ${data.device || "Unknown"} · ${new Date().toLocaleDateString()}`,
  });

  let totalCount = 0;
  const roots = data.roots || [];

  for (let ri = 0; ri < roots.length; ri++) {
    const children = roots[ri].children || [];

    // Loose bookmarks directly in root (key ri--1)
    const looseKey = `${ri}--1`;
    if (!selectedSet || selectedSet.has(looseKey)) {
      for (const child of children) {
        if (child.type === "bookmark") totalCount += await importNode(child, importFolder.id);
      }
    }

    // Sub-folders (key ri-ci where ci is the child index)
    for (let ci = 0; ci < children.length; ci++) {
      if (children[ci].type !== "folder") continue;
      const key = `${ri}-${ci}`;
      if (!selectedSet || selectedSet.has(key)) {
        totalCount += await importNode(children[ci], importFolder.id);
      }
    }
  }

  return { count: totalCount };
}

// ── Message Handler ───────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.action) {
        case "collectBookmarks": sendResponse({ ok: true, data: await collectBookmarks() }); break;
        case "exportJSON": { const d = await collectBookmarks(); sendResponse({ ok: true, json: JSON.stringify(d, null, 2), data: d }); break; }
        case "exportHTML": { const d = await collectBookmarks(); sendResponse({ ok: true, html: toNetscapeHTML(d) }); break; }
        case "syncPush": {
          const stored = await chrome.storage.local.get("syncBinId");
          const r = await syncPush(stored.syncBinId || null, { masterKey: msg.masterKey, accessKey: msg.accessKey });
          sendResponse({ ok: true, ...r });
          break;
        }
        case "syncPull": {
          const d = await syncPull(msg.binId, { masterKey: msg.masterKey, accessKey: msg.accessKey });
          sendResponse({ ok: true, data: d });
          break;
        }
        case "importBookmarks": {
          const r = await importBookmarks(msg.data, msg.selectedIndices ?? null);
          sendResponse({ ok: true, ...r });
          break;
        }
        default: sendResponse({ ok: false, error: "Unknown action" });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e.message });
    }
  })();
  return true;
});
