// Ordered by specificity — most recent Google AI structures first
const AI_SELECTORS = [
  // AI Mode (udm=50) full response
  '.YEVVod .LLtSOc',
  '.Rk2ZYe .LLtSOc',
  'div[jsname="Cpkphb"] .VwiC3b',
  // AI Overviews (SGE)
  '.LLtSOc',
  '.aiO3kf',
  '.HwtpBd',
  // Knowledge panel / rich snippet answers
  '[data-attrid="wa:/description"] .BNeawe',
  '.kno-rdesc span',
  '.IZ6rdc',
  // Featured snippet text
  '.hgKElc',
  '.yDYNvb .BNeawe',
];

function getQuery() {
  return new URLSearchParams(window.location.search).get('q') || '';
}

function extractAIContent() {
  for (const sel of AI_SELECTORS) {
    const els = document.querySelectorAll(sel);
    if (els.length === 0) continue;
    const text = Array.from(els)
      .map(el => el.innerText.trim())
      .filter(t => t.length > 20)
      .join('\n\n');
    if (text.length > 20) return { found: true, text, selector: sel };
  }
  return { found: false, text: '' };
}

function buildSnapshot() {
  const ai = extractAIContent();
  return {
    query: getQuery(),
    url: window.location.href,
    pageTitle: document.title,
    aiContent: ai.text,
    aiFound: ai.found,
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'AISV_GET_STATE') {
    sendResponse(buildSnapshot());
    return true;
  }
});
