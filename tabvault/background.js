// TabVault - Background Service Worker

const JSONBIN_BASE = "https://api.jsonbin.io/v3/b";
const FORMAT_VERSION = "1.0";

// ── Helpers ───────────────────────────────────────────────────────
async function getDeviceName() {
  const s = await chrome.storage.local.get("deviceName");
  return s.deviceName || "My Browser";
}

// Read keys from storage, merged with any overrides the popup passes directly.
// This guards against service worker cold-start where storage reads can lag.
async function getKeys(overrides = {}) {
  const s = await chrome.storage.local.get(["masterKey", "accessKey"]);
  const masterKey = (overrides.masterKey || "").trim() || (s.masterKey || "").trim();
  const accessKey = (overrides.accessKey || "").trim() || (s.accessKey || "").trim();
  return { masterKey, accessKey };
}

// ── Tab Collection ────────────────────────────────────────────────
async function collectTabs() {
  const tabs = await chrome.tabs.query({});
  const groups = {};
  try {
    const allGroups = await chrome.tabGroups.query({});
    for (const g of allGroups) {
      groups[g.id] = { id: g.id, title: g.title || "Unnamed Group", color: g.color, collapsed: g.collapsed };
    }
  } catch (_) {}

  const windows = {};
  for (const tab of tabs) {
    const winId = tab.windowId;
    if (!windows[winId]) windows[winId] = { windowId: winId, groups: {}, ungrouped: [] };
    const win = windows[winId];
    const tabData = {
      title: tab.title || "Untitled",
      url: tab.url || tab.pendingUrl || "",
      favIconUrl: tab.favIconUrl || "",
      pinned: tab.pinned,
      active: tab.active,
      index: tab.index,
    };
    const ungrouped = tab.groupId === -1 || tab.groupId == null || tab.groupId === undefined;
    if (!ungrouped) {
      const gid = String(tab.groupId);
      if (!win.groups[gid]) {
        const m = groups[tab.groupId] || { title: "Unknown", color: "grey", collapsed: false };
        win.groups[gid] = { id: gid, title: m.title, color: m.color, collapsed: m.collapsed, tabs: [] };
      }
      win.groups[gid].tabs.push(tabData);
    } else {
      win.ungrouped.push(tabData);
    }
  }

  return {
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    device: await getDeviceName(),
    windowCount: Object.keys(windows).length,
    windows: Object.values(windows).map((w, idx) => ({
      ...w, label: `Window ${idx + 1}`, groups: Object.values(w.groups),
    })),
  };
}

// ── YAML export / import ──────────────────────────────────────────
function toTabVaultYAML(data) {
  const L = [];
  L.push(`# TabVault Export`);
  L.push(`# Format Version: ${data.version}`);
  L.push(`# Exported: ${data.exportedAt}`);
  L.push(`# Device: ${data.device}`);
  L.push(`# Windows: ${data.windowCount}`);
  L.push(``);
  L.push(`version: "${data.version}"`);
  L.push(`exportedAt: "${data.exportedAt}"`);
  L.push(`device: "${data.device}"`);
  L.push(``);
  L.push(`windows:`);
  for (const win of data.windows) {
    L.push(`  - label: "${win.label}"`);
    L.push(`    windowId: ${win.windowId}`);
    if (win.groups?.length) {
      L.push(`    groups:`);
      for (const grp of win.groups) {
        L.push(`      - title: "${esc(grp.title)}"`);
        L.push(`        color: "${grp.color}"`);
        L.push(`        collapsed: ${grp.collapsed}`);
        L.push(`        tabs:`);
        for (const t of grp.tabs) {
          L.push(`          - title: "${esc(t.title)}"`);
          L.push(`            url: "${t.url}"`);
          if (t.pinned) L.push(`            pinned: true`);
        }
      }
    }
    if (win.ungrouped?.length) {
      L.push(`    ungrouped:`);
      for (const t of win.ungrouped) {
        L.push(`      - title: "${esc(t.title)}"`);
        L.push(`        url: "${t.url}"`);
        if (t.pinned) L.push(`        pinned: true`);
      }
    }
  }
  return L.join("\n");
}

function esc(s) { return (s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }

function parseTabVaultYAML(yaml) {
  try {
    const lines = yaml.split("\n").filter(l => !l.trimStart().startsWith("#") && l.trim());
    const data = { windows: [] };
    let win = null, grp = null, section = null, tab = null, inGrpTabs = false;
    for (const line of lines) {
      const ind = line.length - line.trimStart().length;
      const t = line.trim();
      if (t.startsWith("version:")) data.version = val(t);
      else if (t.startsWith("exportedAt:")) data.exportedAt = val(t);
      else if (t.startsWith("device:")) data.device = val(t);
      else if (ind === 2 && t.startsWith("- label:")) { win = { label: val(t.slice(2)), groups: [], ungrouped: [] }; data.windows.push(win); grp = null; section = null; inGrpTabs = false; }
      else if (ind === 4 && t === "groups:") { section = "groups"; inGrpTabs = false; }
      else if (ind === 4 && t === "ungrouped:") { section = "ungrouped"; grp = null; inGrpTabs = false; }
      else if (ind === 6 && t.startsWith("- title:") && section === "groups") { grp = { title: val(t.slice(2)), tabs: [], color: "grey", collapsed: false }; win?.groups.push(grp); inGrpTabs = false; }
      else if (ind === 8 && t === "tabs:") { inGrpTabs = true; }
      else if (ind === 10 && t.startsWith("- title:") && inGrpTabs) { tab = { title: val(t.slice(2)), url: "" }; grp?.tabs.push(tab); }
      else if (ind === 10 && t.startsWith("url:") && inGrpTabs) { if (tab) tab.url = val(t); }
      else if (ind === 6 && t.startsWith("- title:") && section === "ungrouped") { tab = { title: val(t.slice(2)), url: "" }; win?.ungrouped.push(tab); }
      else if (ind === 6 && t.startsWith("url:") && section === "ungrouped") { if (tab) tab.url = val(t); }
      else if (ind === 8 && t.startsWith("- title:") && section === "ungrouped") { tab = { title: val(t.slice(2)), url: "" }; win?.ungrouped.push(tab); }
      else if (ind === 8 && t.startsWith("url:") && section === "ungrouped") { if (tab) tab.url = val(t); }
      else if (ind === 8 && t.startsWith("color:") && grp && !inGrpTabs) { grp.color = val(t); }
      else if (ind === 8 && t.startsWith("collapsed:") && grp) { grp.collapsed = t.includes("true"); }
    }
    return data;
  } catch (_) { return null; }
}

function val(s) {
  const m = s.match(/:\s*"?([^"]*)"?\s*$/);
  return m ? m[1].replace(/\\"/g, '"') : "";
}

// ── JSONBin v3 Sync ───────────────────────────────────────────────
//
// Auth rules (confirmed from JSONBin docs):
//   - X-Master-Key  → full access, use for BOTH push AND pull of your own bins
//   - X-Access-Key  → scoped key, can read/write if permission granted
//   - Pass ONE header only, not both
//   - Read URL: GET /v3/b/<BIN_ID>  (no /latest suffix needed for current version)
//   - Private bins require auth on read; public bins need no auth
//
async function syncPush(binId, keyOverrides = {}) {
  const { masterKey } = await getKeys(keyOverrides);
  if (!masterKey) throw new Error("Master Key required. Add it in the Sync panel.");

  const data = await collectTabs();
  const isUpdate = !!binId;
  const url    = isUpdate ? `${JSONBIN_BASE}/${binId}` : JSONBIN_BASE;
  const method = isUpdate ? "PUT" : "POST";

  const headers = {
    "Content-Type": "application/json",
    "X-Master-Key": masterKey,
  };

  if (!isUpdate) {
    headers["X-Bin-Name"]    = `TabVault-${data.device}`;
    headers["X-Bin-Private"] = "true";  // always private when authed
  }

  const res = await fetch(url, { method, headers, body: JSON.stringify({ tabvault: data }) });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Push ${res.status}: ${body || res.statusText}`);
  }

  const json = await res.json();
  const newBinId = json.metadata?.id || binId;
  let tabCount = 0;
  for (const win of data.windows) {
    for (const grp of (win.groups || [])) tabCount += (grp.tabs || []).length;
    tabCount += (win.ungrouped || []).length;
  }
  const h = await chrome.storage.local.get("syncHistory");
  const hist = h.syncHistory || [];
  hist.unshift({ binId: newBinId, pushedAt: new Date().toISOString(), device: data.device, count: tabCount });
  await chrome.storage.local.set({ syncBinId: newBinId, lastSyncedAt: new Date().toISOString(), syncHistory: hist.slice(0, 10) });
  return { binId: newBinId, data };
}

async function syncPull(binId, keyOverrides = {}) {
  if (!binId) throw new Error("No Sync ID provided.");

  const { masterKey, accessKey } = await getKeys(keyOverrides);

  const headers = { "X-Bin-Meta": "false" };

  // Use whichever key is available — one at a time, master key preferred
  if (masterKey) {
    headers["X-Master-Key"] = masterKey;
  } else if (accessKey) {
    headers["X-Access-Key"] = accessKey;
  }
  // No key = will work for public bins only

  // Correct JSONBin v3 read URL — no /latest suffix (that's only for versioned bins)
  const res = await fetch(`${JSONBIN_BASE}/${binId}`, { headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Pull ${res.status}: ${body || res.statusText}`);
  }

  const json = await res.json();
  // X-Bin-Meta:false → response is the record object directly
  // But JSONBin sometimes still wraps in { record: {...} }
  const record = json.record ?? json;
  return record.tabvault ?? record;
}

// ── Import tabs (with groups) ─────────────────────────────────────
//
// Strategy: open all tabs for a window first, then group them using
// chrome.tabGroups. Each exported window maps to the CURRENT window
// (multi-window restore isn't possible from an extension popup, but
// groups and colours are fully preserved).
//
async function importTabs(data) {
  const currentWindow = await chrome.windows.getCurrent();
  const winId = currentWindow.id;

  // Chrome colour names accepted by tabGroups.update
  const VALID_COLORS = new Set([
    "grey","blue","red","yellow","green","pink","purple","cyan","orange"
  ]);

  let totalCount = 0;

  for (const win of (data.windows || [])) {
    // ── Grouped tabs ────────────────────────────────────────────
    for (const grp of (win.groups || [])) {
      const validTabs = (grp.tabs || []).filter(t => t.url?.startsWith("http"));
      if (!validTabs.length) continue;

      // Create all tabs in this group
      const tabIds = [];
      for (const t of validTabs) {
        const tab = await chrome.tabs.create({ url: t.url, windowId: winId, active: false, pinned: !!t.pinned });
        tabIds.push(tab.id);
        totalCount++;
      }

      // Group them
      const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId: winId } });

      // Apply colour and title
      const color = VALID_COLORS.has(grp.color?.toLowerCase()) ? grp.color.toLowerCase() : "grey";
      await chrome.tabGroups.update(groupId, {
        title: grp.title || "",
        color,
        collapsed: !!grp.collapsed,
      });
    }

    // ── Ungrouped tabs ───────────────────────────────────────────
    for (const t of (win.ungrouped || [])) {
      if (!t.url?.startsWith("http")) continue;
      await chrome.tabs.create({ url: t.url, windowId: winId, active: false, pinned: !!t.pinned });
      totalCount++;
    }
  }

  return totalCount;
}

// ── Message Handler ───────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.action) {
        case "collectTabs":  sendResponse({ ok: true, data: await collectTabs() }); break;
        case "exportYAML": { const d = await collectTabs(); sendResponse({ ok: true, yaml: toTabVaultYAML(d), data: d }); break; }
        case "parseYAML":  { const d = parseTabVaultYAML(msg.yaml); sendResponse({ ok: !!d, data: d }); break; }

        // Keys are always read from storage inside the functions — popup doesn't need to pass them
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

        case "importTabs":  sendResponse({ ok: true, count: await importTabs(msg.data) }); break;
        case "openTabView": {
          const url = chrome.runtime.getURL("pages/tabview.html");
          const ex = await chrome.tabs.query({ url });
          if (ex.length) await chrome.tabs.update(ex[0].id, { active: true });
          else await chrome.tabs.create({ url });
          sendResponse({ ok: true });
          break;
        }
        case "focusTab": {
          const matches = await chrome.tabs.query({ url: msg.url });
          if (matches.length) {
            await chrome.tabs.update(matches[0].id, { active: true });
            await chrome.windows.update(matches[0].windowId, { focused: true });
            sendResponse({ ok: true, found: true });
          } else {
            sendResponse({ ok: true, found: false });
          }
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
