(function(){
  const ROOT_ID = '__live_caption_overlay__';
  let root = null;
  let captionEl = null;
  let subEl = null;
  let lastText = '';

  function ensureRoot(){
    if (root && document.body.contains(root)) return root;
    root = document.getElementById(ROOT_ID);
    if (!root){
      root = document.createElement('div');
      root.id = ROOT_ID;
      root.style.position = 'fixed';
      root.style.left = '50%';
      root.style.bottom = '60px';
      root.style.transform = 'translateX(-50%)';
      root.style.maxWidth = '80%';
      root.style.zIndex = '2147483647';
      root.style.pointerEvents = 'none';
      document.documentElement.appendChild(root);

      captionEl = document.createElement('div');
      captionEl.style.background = 'rgba(0,0,0,0.85)';
      captionEl.style.color = '#fff';
      captionEl.style.padding = '12px 24px';
      captionEl.style.borderRadius = '8px';
      captionEl.style.fontSize = '24px';
      captionEl.style.fontWeight = '600';
      captionEl.style.textAlign = 'center';
      captionEl.style.textShadow = '2px 2px 4px rgba(0,0,0,0.9)';
      captionEl.style.lineHeight = '1.4';
      captionEl.style.wordWrap = 'break-word';

      subEl = document.createElement('div');
      subEl.style.textAlign = 'center';
      subEl.style.marginTop = '8px';
      subEl.style.fontSize = '16px';
      subEl.style.opacity = '0.7';
      subEl.style.textShadow = '1px 1px 3px rgba(0,0,0,0.9)';

      root.appendChild(captionEl);
      root.appendChild(subEl);
    }
    return root;
  }

  function updateCaption(text){
    ensureRoot();
    lastText = text || '';
    captionEl.textContent = lastText;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'caption_update'){
      const p = msg.payload || {};
      updateCaption(p.liveCaption || p.liveTranslated || p.liveText || '');
    }
  });

  // Request last caption on first load so new tabs show overlay immediately
  try {
    chrome.runtime.sendMessage({ type: 'get_last_caption' }, (resp) => {
      if (resp?.payload) {
        const p = resp.payload;
        updateCaption(p.liveCaption || p.liveTranslated || p.liveText || '');
      }
    });
  } catch {}
})();