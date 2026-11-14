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
  chrome.storage.sync.set({ enabled: state.enabled, dimLevel: state.dimLevel });
  broadcast();
}

// Load saved state
chrome.storage.sync.get(['enabled', 'dimLevel'], ({ enabled = false, dimLevel = 40 }) => {
  state = { enabled, dimLevel };
  updateUI();
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
