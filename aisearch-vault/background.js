const TRACKING_COOKIES = [
  'NID', '1P_JAR', 'OTZ', 'AID', 'TAID', 'DV', 'SOCS',
  'HSID', 'SSID', 'APISID', 'SAPISID', 'SID',
  '__utma', '__utmb', '__utmc', '__utmz', '__utmv',
  '_ga', '_gid', '_gat',
];

async function cleanTrackingCookies() {
  const url = 'https://www.google.com';
  for (const name of TRACKING_COOKIES) {
    try { await chrome.cookies.remove({ url, name }); } catch {}
  }
}

async function setPrivacyMode(enabled) {
  if (enabled) {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['tracking_rules'],
      disableRulesetIds: [],
    });
    await cleanTrackingCookies();
    chrome.alarms.create('cookieCleanup', { periodInMinutes: 5 });
  } else {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [],
      disableRulesetIds: ['tracking_rules'],
    });
    chrome.alarms.clear('cookieCleanup');
  }
  await chrome.storage.sync.set({ privacyMode: enabled });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cookieCleanup') cleanTrackingCookies();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'AISV_SET_PRIVACY') {
    setPrivacyMode(msg.enabled)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (msg.type === 'AISV_CLEAN_COOKIES') {
    cleanTrackingCookies()
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ privacyMode: false });
});
