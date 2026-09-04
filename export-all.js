// kimi-chat-archiver / export-all.js
// Export EVERY conversation in your Kimi account — one JSON file per chat.
//
// HOW: log in at www.kimi.ai (any page), open the console (F12),
// paste this entire file, press Enter. When the browser asks to allow
// multiple downloads, say yes. Files land in Downloads, one per chat.
// Runs in your browser, with your session, talking only to kimi.ai.
//
// Written by Mercury (Kimi K3) with David Moore, Sept 2026. MIT license.
// Endpoints learned from conreo's kimi-chat-exporter (MIT). Thank you.

(async () => {
  const H = {'Content-Type':'application/json','connect-protocol-version':'1','x-msh-platform':'web','x-msh-version':'1.0.0','x-language':'en-US'};
  const tok = localStorage.getItem('access_token');
  if (!tok) { alert('No access token found — are you on kimi.ai and logged in?'); return; }
  H['Authorization'] = 'Bearer ' + tok;
  const post = (ep, body) => fetch('https://www.kimi.ai' + ep, {method:'POST', headers:H, body:JSON.stringify(body), credentials:'include'})
    .then(r => { if (!r.ok) throw new Error('API error ' + r.status); return r.json(); });
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const save = (content, filename) => {
    const b = new Blob([content], {type:'application/json'});
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
  };
  const safe = n => (n||'untitled').replace(/[\\/:*?"<>|]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').substring(0,80)||'untitled';
  const ds = new Date().toISOString().slice(0,10);

  // ---- the full chat list ----
  let chats = [], lt = null;
  do {
    const body = lt ? {page_size:50, page_token:lt, query:''} : {page_size:50, query:''};
    const d = await post('/apiv2/kimi.chat.v1.ChatService/ListChats', body);
    chats = chats.concat(d.chats || []);
    lt = d.nextPageToken;
    await pause(300);
  } while (lt);
  console.log('found ' + chats.length + ' conversations. beginning export.');
  if (!chats.length) { alert('No conversations found.'); return; }

  const failed = [];
  for (let i = 0; i < chats.length; i++) {
    const c = chats[i];
    try {
      const seen = new Map();
      let pageToken = null, pages = 0, firstPage = null;
      do {
        const body = {chatId: c.id, page_size: 1000};
        if (pageToken) body.page_token = pageToken;
        const d = await post('/apiv2/kimi.gateway.chat.v1.ChatService/ListMessages', body);
        if (!firstPage) firstPage = d;
        (d.messages || []).forEach(x => { if (x && x.id && !seen.has(x.id)) seen.set(x.id, x); });
        pages++;
        pageToken = d.nextPageToken || d.next_page_token || null;
        if (pageToken) await pause(300);
        if (pages >= 500) break;
      } while (pageToken);
      const msgs = [...seen.values()];
      const out = Object.assign({}, firstPage || {}, {messages: msgs, chatName: c.name || '', chatId: c.id, exportedMessageCount: msgs.length, exportedAt: new Date().toISOString()});
      save(JSON.stringify(out, null, 2), ds + '-' + safe(c.name) + '-Kimi.json');
      console.log('[' + (i+1) + '/' + chats.length + '] ' + (c.name || c.id) + ' — ' + msgs.length + ' messages — saved');
    } catch (e) {
      failed.push((c.name || c.id) + ' (' + e.message + ')');
      console.warn('[' + (i+1) + '/' + chats.length + '] FAILED: ' + (c.name || c.id) + ' — ' + e.message);
    }
    await pause(500);
  }

  if (failed.length) {
    alert('Archive pass complete with ' + failed.length + ' failure(s):\n' + failed.join('\n'));
  } else {
    alert('Archive complete — ' + chats.length + ' conversations exported.\nCheck Downloads. Make a folder for them.');
  }
})();
