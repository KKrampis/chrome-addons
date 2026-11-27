# Chrome Add-ons Collection

A personal collection of Chrome/Chromium browser extensions — some built from scratch, others tracked as git submodules for local development or offline installation.

---

## Extensions Built Here

### 🔍 AISearch Vault — [`aisearch-vault/`](aisearch-vault/)

Snapshots Google AI Mode and AI Overviews search results so you can keep, annotate, and archive them.

**Features**
- Detects AI-generated content on any Google Search page and captures it alongside the query, URL, and timestamp
- Editable title and notes for each snapshot before saving
- Local library with inline editing and delete
- One-click push to **JSONbin** (creates/updates a single bin) or **GitHub** (creates/updates a JSON file in a repo of your choice)
- **Privacy Shield** — blocks 12 Google tracking/ad request endpoints (Analytics, Tag Manager, DoubleClick, etc.) via `declarativeNetRequest` rules; also periodically clears known tracking cookies (NID, 1P\_JAR, \_ga, …) on a 5-minute alarm cycle
- Settings page for API keys (JSONbin Master Key, GitHub personal access token + owner/repo/path) and privacy toggle

**Load:** `chrome://extensions` → Load unpacked → `aisearch-vault/`

---

### 🌙 NightDim – Page Dimmer — [`nightdim/`](nightdim/)

Overlays a semi-transparent black layer on any web page for comfortable reading in low-light environments.

**Features**
- Adjustable darkness from 5 % to 90 % via a smooth slider
- Four quick presets: Light (20 %), Medium (40 %), Dark (65 %), Night (85 %)
- Toggle on/off per session — overlay is **always off on page load** so it never activates unexpectedly on new tabs
- Dim level is synced via `chrome.storage.sync`; enabled state is per-tab only and never persisted
- `pointer-events: none` overlay so it never blocks clicks or selections

**Load:** `chrome://extensions` → Load unpacked → `nightdim/`

---

### 🔖 BookmarkVault — [`bookmarkvault/`](bookmarkvault/)

Export, sync, and restore Chrome bookmarks across devices with no account required.

**Load:** `chrome://extensions` → Load unpacked → `bookmarkvault/`

---

### ⬡ TabVault — [`tabvault/`](tabvault/)

Export, sync, and visualize all open Chrome tabs and tab groups.

**Features**
- Export tabs to a human-readable `.tabvault` (YAML) or JSON file
- Import and reopen tabs from a saved file
- Sync tabs between browsers via JSONbin (no account required for public sync)
- Full-page tab visualiser with search, collapse/expand, and click-to-switch
- YAML format is diff-friendly and version-controllable

**Load:** `chrome://extensions` → Load unpacked → `tabvault/`

---

### 🌓 ReaDark — [`ReaDark/`](ReaDark/)

Turns any website to reading mode, dark mode, or both.

Applies CSS colour transformations (warm tones for reading mode, dark palette for night mode) globally across all tabs. Available on the [Chrome Web Store](https://chrome.google.com/webstore/detail/readark-reading-dark-mode/jncmnckpeiiencchkldgodbckocgnnkk).

**Load:** `chrome://extensions` → Load unpacked → `ReaDark/`

---

## Submodules — Third-Party Extensions

These are tracked as git submodules pointing to their upstream repositories. Use them for local development, inspection, or offline installation via developer mode.

### 🛡 uBlock Origin — [`uBlock0.chromium/`](uBlock0.chromium/)

The gold-standard open-source ad and content blocker by Raymond Hill. Tracked from [gorhill/uBlock](https://github.com/gorhill/uBlock).

**Build and load:**
```bash
cd uBlock0.chromium
make chromium
# then load from:  dist/build/uBlock0.chromium/
```

> The build output in `dist/build/` is gitignored. Re-run `make chromium` after any `git submodule update`.

---

### 📎 Obsidian Web Clipper — [`obsidian-clipper/`](obsidian-clipper/)

Official Obsidian extension for highlighting and clipping web pages to Markdown files. Tracked from [obsidianmd/obsidian-clipper](https://github.com/obsidianmd/obsidian-clipper).

Saved content is stored as durable Markdown, readable offline.

---

### 📄 Reader View — [`reader-view/`](reader-view/)

Strips away clutter (ads, navigation, background images) and reformats pages for focused reading. Adjustable text size, contrast, and layout.

---

### 🔑 VimDF — [`vimdf/`](vimdf/)

Adds Vim keybindings to Chrome's built-in PDF viewer. Navigate PDFs with `j`/`k`, jump to pages, search, and more — without leaving the browser.

---

### 🔬 Zotero Connectors — [`zotero-connectors/`](zotero-connectors/)

Official Zotero browser connector. Saves research papers, web pages, and bibliographic metadata directly to your Zotero library with one click. Tracked from [zotero/zotero-connectors](https://github.com/zotero/zotero-connectors).

---

### 🛠 Proton VPN — [`proton-vpn-browser-extension/`](proton-vpn-browser-extension/)

Proton VPN browser extension for one-click VPN connection and privacy protection. Tracked from [ProtonVPN/proton-vpn-browser-extension](https://github.com/ProtonVPN/proton-vpn-browser-extension).

---

### 📦 inoxunpack — [`inoxunpack/`](inoxunpack/)

Command-line tool to download and unpack Chrome extensions from the Web Store. Useful for auditing or installing extensions offline via developer mode.

---

## Updating Submodules

```bash
# Update all submodules to their latest tracked commit
git submodule update --remote --merge

# Update a single submodule
git submodule update --remote uBlock0.chromium
```
