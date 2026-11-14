const OVERLAY_ID = '__nightdim_overlay__';

function getOrCreateOverlay() {
  let el = document.getElementById(OVERLAY_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:#000',
      'pointer-events:none',
      'z-index:2147483647',
      'opacity:0',
      'transition:opacity 0.25s ease',
      'display:none',
    ].join('!important;') + '!important';
    document.documentElement.appendChild(el);
  }
  return el;
}

function applyState(enabled, dimLevel) {
  const el = getOrCreateOverlay();
  if (enabled) {
    el.style.setProperty('display', 'block', 'important');
    requestAnimationFrame(() => {
      el.style.setProperty('opacity', String(dimLevel / 100), 'important');
    });
  } else {
    el.style.setProperty('opacity', '0', 'important');
    setTimeout(() => el.style.setProperty('display', 'none', 'important'), 260);
  }
}

chrome.storage.sync.get(['enabled', 'dimLevel'], ({ enabled = false, dimLevel = 40 }) => {
  applyState(enabled, dimLevel);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'NIGHTDIM_UPDATE') {
    applyState(msg.enabled, msg.dimLevel);
  }
});
