let ws = null;
let sessionId = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;
let lastCaptionPayload = null; // store last received caption for late-opening tabs

// Auto-load session from local storage
chrome.storage.local.get(['sessionId'], (data) => {
  if (data.sessionId) {
    sessionId = data.sessionId;
    connect();
  }
});

function connect() {
  if (!sessionId) return;
  const url = `ws://localhost:8000/ws/${sessionId}`;
  ws = new WebSocket(url);
  ws.onopen = () => {
    reconnectAttempts = 0;
  };
  ws.onmessage = (evt) => {
    const txt = String(evt.data || '');
    if (!txt.startsWith('{')) return; // ignore non-JSON
    const data = JSON.parse(txt);
    if (data && data.event === 'segments') {
      lastCaptionPayload = data;
      broadcastCaption(data);
    }
  };
  ws.onclose = () => scheduleReconnect();
  ws.onerror = () => {
    try { ws.close(); } catch {}
  };
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT) return;
  reconnectAttempts++;
  setTimeout(connect, Math.min(5000, 500 * reconnectAttempts));
}

function broadcastCaption(payload){
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'caption_update', payload });
      }
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg?.type === 'set_session') {
    sessionId = msg.sessionId;
    chrome.storage.local.set({ sessionId });
    if (ws) { try { ws.close(); } catch {} }
    connect();
    reply({ ok: true });
  } else if (msg?.type === 'get_last_caption') {
    reply({ ok: true, payload: lastCaptionPayload });
  }
  return true;
});

// When a new tab updates (complete), re-send last caption
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && lastCaptionPayload) {
    chrome.tabs.sendMessage(tabId, { type: 'caption_update', payload: lastCaptionPayload });
  }
});