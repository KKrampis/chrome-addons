# ⬡ TabVault

> Export, sync, and visualize your Chrome tabs and groups. Human-readable format. No account required.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## Features

- **📤 Export** — Save all open tabs + tab groups to a human-readable `.tabvault` (YAML) file, or JSON
- **📥 Import** — Open tabs from a `.tabvault` or `.json` export file
- **☁️ Sync** — Push/pull tabs between browsers via [JSONBin.io](https://jsonbin.io) REST API (no account needed for public sync)
- **⬡ Tab Visualizer** — Beautiful full-page view of all tabs organized by window and group, with search and collapse/expand
- **🔗 Tab Switching** — Click any tab in the visualizer to instantly jump to it (or open it if closed)
- **📋 GitHub-friendly** — YAML format is diff-friendly and version-controllable

---

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer Mode** (top right)
4. Click **Load unpacked**
5. Select the `tabvault` folder

---

## Export Format (`.tabvault`)

The `.tabvault` file is standard YAML — human-readable, diff-friendly, and perfect for GitHub versioning:

```yaml
# TabVault Export
# Format Version: 1.0
# Exported: 2026-04-05T14:23:11.000Z
# Device: My MacBook Pro
# Windows: 2

version: "1.0"
exportedAt: "2026-04-05T14:23:11.000Z"
device: "My MacBook Pro"

windows:
  - label: "Window 1"
    windowId: 1
    groups:
      - title: "Work"
        color: "blue"
        collapsed: false
        tabs:
          - title: "GitHub"
            url: "https://github.com"
          - title: "Linear"
            url: "https://linear.app"
      - title: "Research"
        color: "purple"
        collapsed: true
        tabs:
          - title: "Arxiv"
            url: "https://arxiv.org"
    ungrouped:
      - title: "Gmail"
        url: "https://mail.google.com"
        pinned: true
```

---

## Sync (No Account Required)

TabVault uses [JSONBin.io](https://jsonbin.io) as a free, public REST API for cross-browser sync:

1. **Push** your tabs → get a **Sync ID** (e.g. `6622f8...`)
2. **Share** the Sync ID with your other browser
3. **Pull** on the other browser using that ID

> **Optionally**, create a free account at [jsonbin.io](https://jsonbin.io) and enter your API key for **private encrypted bins**.

### How it works

```
Browser A                    JSONBin.io               Browser B
    │                            │                         │
    │─── POST /v3/b (tabs) ──────▶                         │
    │◀── { binId: "abc123" } ────│                         │
    │                            │                         │
    │    [share "abc123"]        │                         │
    │                            │                         │
    │                            │◀── GET /v3/b/abc123 ────│
    │                            │─── { tabs... } ────────▶│
```

---

## Tab Visualizer

Click **⬡ Open Tab Visualizer** in the popup (or the footer button) to open a beautiful full-page dashboard:

- **Grouped view** — Tab groups shown as collapsible cards with their Chrome color
- **Ungrouped tabs** — Listed below groups, also collapsible
- **Search** — Filter tabs by title or URL in real time
- **Click to focus** — Click any tab to jump to it; if it's closed, it will be opened
- **Collapse All / Expand All** buttons
- **Refresh** — Re-reads your current tabs live

---

## Popup Panels

| Panel | Description |
|-------|-------------|
| **Export** | Download `.tabvault` (YAML) or `.json`, open Tab Visualizer |
| **Sync** | Push to JSONBin, copy Sync ID, pull from another device |
| **Import** | Paste YAML/JSON content and open all tabs |
| **Settings** | Set device name, clear sync data |

---

## GitHub Version Control

Since `.tabvault` is YAML, you can:

```bash
# Save your tabs as a snapshot
git add my-tabs-2026-04-05.tabvault
git commit -m "tab snapshot: research session"

# Diff between sessions
git diff my-tabs-yesterday.tabvault my-tabs-today.tabvault

# Restore a session
# (paste the file content into TabVault's Import tab)
```

---

## Project Structure

```
tabvault/
├── manifest.json        # Chrome Extension Manifest v3
├── background.js        # Service worker: tab collection, sync, import
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic
├── pages/
│   └── tabview.html     # Full-page Tab Visualizer
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Permissions

| Permission | Why |
|-----------|-----|
| `tabs` | Read open tabs and their info |
| `tabGroups` | Read tab group names and colors |
| `storage` | Remember sync ID, device name, API key |
| `downloads` | Save exported files |
| `https://api.jsonbin.io/*` | Cloud sync via JSONBin REST API |

---

## Privacy

- No data is sent anywhere unless you explicitly click **Push**
- Public bins on JSONBin.io are accessible to anyone with the Bin ID
- Use a JSONBin API key + private bins for sensitive browsing data
- The extension never auto-syncs without user action

---

## License

MIT — do whatever you want with it.
