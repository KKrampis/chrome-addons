const fields = {
  jsonbinKey:  document.getElementById('jsonbinKey'),
  jsonbinId:   document.getElementById('jsonbinId'),
  githubToken: document.getElementById('githubToken'),
  githubOwner: document.getElementById('githubOwner'),
  githubRepo:  document.getElementById('githubRepo'),
  githubPath:  document.getElementById('githubPath'),
};
const privacyToggle = document.getElementById('privacyMode');
const saveBtn    = document.getElementById('saveBtn');
const savedMsg   = document.getElementById('savedMsg');
const cleanNow   = document.getElementById('cleanNow');
const cleanStatus = document.getElementById('cleanStatus');

const KEYS = Object.keys(fields).concat(['privacyMode']);

async function load() {
  const data = await chrome.storage.sync.get(KEYS);
  for (const [k, el] of Object.entries(fields)) {
    if (data[k]) el.value = data[k];
  }
  privacyToggle.checked = data.privacyMode ?? false;
}

saveBtn.addEventListener('click', async () => {
  const values = {};
  for (const [k, el] of Object.entries(fields)) {
    values[k] = el.value.trim();
  }
  values.privacyMode = privacyToggle.checked;
  await chrome.storage.sync.set(values);

  // Apply privacy mode immediately
  await chrome.runtime.sendMessage({ type: 'AISV_SET_PRIVACY', enabled: privacyToggle.checked });

  savedMsg.hidden = false;
  setTimeout(() => { savedMsg.hidden = true; }, 2500);
});

cleanNow.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'AISV_CLEAN_COOKIES' });
  cleanStatus.textContent = 'Cookies cleared.';
  cleanStatus.hidden = false;
  setTimeout(() => { cleanStatus.hidden = true; }, 2500);
});

load();
