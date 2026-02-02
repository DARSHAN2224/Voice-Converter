// Options page script for Live Captions extension
const inp = document.getElementById('session');
const status = document.getElementById('status');

// Load saved session ID
chrome.storage.local.get(['sessionId'], (data) => {
  if (data.sessionId) inp.value = data.sessionId;
});

// Save button handler
document.getElementById('save').addEventListener('click', () => {
  const sid = inp.value.trim();
  if (!sid) {
    status.textContent = 'Enter session id';
    return;
  }
  chrome.storage.local.set({ sessionId: sid });
  chrome.runtime.sendMessage({ type: 'set_session', sessionId: sid }, (resp) => {
    status.textContent = resp?.ok ? 'Connected' : 'Failed';
  });
});
