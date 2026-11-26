chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ dimLevel: 40 });
});
