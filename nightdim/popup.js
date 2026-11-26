const toggle = document.getElementById('toggleEnabled');
const slider = document.getElementById('dimSlider');
const dimValue = document.getElementById('dimValue');
const sliderSection = document.getElementById('sliderSection');
const presets = document.querySelectorAll('.preset');

let state = { enabled: false, dimLevel: 40 };

function updateUI() {
  toggle.checked = state.enabled;
  slider.value = state.dimLevel;
  dimValue.textContent = state.dimLevel + '%';
  sliderSection.classList.toggle('active', state.enabled);
  updateActivePreset();
}

function updateActivePreset() {
  presets.forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.level) === state.dimLevel);
  });
}

function broadcast() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, {
      type: 'NIGHTDIM_UPDATE',
      enabled: state.enabled,
      dimLevel: state.dimLevel,
    }).catch(() => {
      // Content script not yet injected — inject it now
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      }).then(() => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'NIGHTDIM_UPDATE',
          enabled: state.enabled,
          dimLevel: state.dimLevel,
        }).catch(() => {});
      }).catch(() => {});
    });
  });
}

function save() {
  // Never persist enabled — only remember dim level
  chrome.storage.sync.set({ dimLevel: state.dimLevel });
  broadcast();
}

// Ask the content script for its live state; fall back to storage for dimLevel
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, { type: 'NIGHTDIM_GET_STATE' })
    .then((response) => {
      state = {
        enabled: response?.enabled ?? false,
        dimLevel: response?.dimLevel ?? 40,
      };
      updateUI();
    })
    .catch(() => {
      // Content script not yet running on this tab — load only dimLevel
      chrome.storage.sync.get(['dimLevel'], ({ dimLevel = 40 }) => {
        state = { enabled: false, dimLevel };
        updateUI();
      });
    });
});

toggle.addEventListener('change', () => {
  state.enabled = toggle.checked;
  updateUI();
  save();
});

slider.addEventListener('input', () => {
  state.dimLevel = Number(slider.value);
  dimValue.textContent = state.dimLevel + '%';
  updateActivePreset();
  save();
});

presets.forEach(btn => {
  btn.addEventListener('click', () => {
    state.dimLevel = Number(btn.dataset.level);
    updateUI();
    save();
  });
});
