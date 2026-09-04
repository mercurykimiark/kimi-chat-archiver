// kimi-chat-archiver / export-chat.js
// Export the Kimi conversation you are currently viewing to JSON + Markdown.
// Walks past the server's 1,000-message page cap, back to message one.
//
// HOW: open the conversation on www.kimi.ai, open the console (F12),
// paste this entire file, press Enter. Files land in Downloads.
// Runs in your browser, with your session, talking only to kimi.ai.
//
// Written by Mercury (Kimi K3) with David Moore, Sept 2026. MIT license.
// Endpoints learned from conreo's kimi-chat-exporter (MIT). Thank you.

(async () => {
  const H = {'Content-Type':'application/json','connect-protocol-version':'1','x-msh-platform':'web','x-msh-version':'1.0.0','x-language':'en-US'};
  const tok = localStorage.getItem('access_token');
  if (!tok) { alert('No access token found — are you on kimi.ai and logged in?'); return; }
  H['Authorization'] = 'Bearer ' + tok;
  const m = location.pathname.match(/\/chat\/([a-f0-9-]+)/);
  if (!m) { alert('Open the conversation first — the address should contain /chat/...'); return; }
  const chatId = m[1];
  const post = (ep, body) => fetch('https://www.kimi.ai' + ep, {method:'POST', headers:H, body:JSON.stringify(body), credentials:'include'})
    .then(r => { if (!r.ok) throw new Error('API error ' + r.status); return r.json(); });

  // ---- find the conversation title ----
  let name = chatId, lt = null;
  do {
    const body = lt ? {page_size:50, page_token:lt, query:''} : {page_size:50, query:''};
    const d = await post('/apiv2/kimi.chat.v1.ChatService/ListChats', body);
    const f = (d.chats||[]).find(c => c.id === chatId);
    if (f) { name = f.name; break; }
    lt = d.nextPageToken;
  } while (lt);

  // ---- walk backward through EVERY page of messages ----
  const seen = new Map();
  let pageToken = null, pages = 0, rawKeys = new Set(), firstPage = null;
  do {
    const body = {chatId, page_size: 1000};
    if (pageToken) body.page_token = pageToken;
    const d = await post('/apiv2/kimi.gateway.chat.v1.ChatService/ListMessages', body);
    Object.keys(d).forEach(k => rawKeys.add(k));
    if (!firstPage) firstPage = d;
    const batch = d.messages || [];
    let fresh = 0;
    batch.forEach(x => { if (x && x.id && !seen.has(x.id)) { seen.set(x.id, x); fresh++; } });
    pages++;
    pageToken = d.nextPageToken || d.next_page_token || null;
    console.log('page ' + pages + ' — ' + batch.length + ' messages (' + fresh + ' new); total ' + seen.size + '; next page: ' + (pageToken ? 'yes' : 'no'));
    if (!batch.length || (pages > 1 && fresh === 0)) { console.log('stopping: no new messages on this page.'); break; }
    if (pageToken) await new Promise(r => setTimeout(r, 300));
  } while (pageToken && pages < 500);
  if (pages >= 500) console.warn('Hit the 500-page safety stop.');
  console.log('server response keys seen: ' + [...rawKeys].join(', '));

  const msgs = [...seen.values()];
  if (!msgs.length) { alert('No messages came back.'); return; }

  // ---- download helper ----
  const save = (content, filename, type) => {
    const b = new Blob([content], {type});
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
  };
  const safe = (name||'untitled').replace(/[\\/:*?"<>|]/g,'-').replace(/-+/g,'-').substring(0,80);
  const ds = new Date().toISOString().slice(0,10);
  const base = ds + '-' + safe + '-Kimi';

  // ---- JSON: lossless, every message ----
  const out = Object.assign({}, firstPage, {messages: msgs, exportedMessageCount: msgs.length, exportedAt: new Date().toISOString()});
  save(JSON.stringify(out, null, 2), base + '.json', 'application/json');

  // ---- Markdown twin: ordered from the true root ----
  const PUA = /[\ue000-\uf8ff]/g;
  const map = new Map(msgs.map(x => [x.id, x]));
  const root = msgs.find(x => x.parentId === '00000000-0000-0000-0000-000000000000' || x.role === 'system');
  let ord = [];
  if (root) {
    const w = id => { const x = map.get(id); if (!x) return; if (x.role !== 'system') ord.push(x); (x.childrenMessageIds||[]).forEach(w); };
    if (root.role === 'system') { (root.childrenMessageIds||[]).forEach(w); } else { ord.push(root); (root.childrenMessageIds||[]).forEach(w); }
  } else {
    ord = msgs.slice().sort((a,b) => String(a.createTime||'').localeCompare(String(b.createTime||'')));
  }
  let md = '# Kimi: ' + (name||'').replace(PUA,'') + '\n**Exported:** ' + new Date().toISOString() + '\n**Chat ID:** ' + chatId + '\n**Messages:** ' + ord.length + '\n\n---\n\n';
  ord.forEach(x => {
    const role = x.role === 'user' ? 'User' : x.role === 'assistant' ? 'Kimi' : 'System';
    const parts = [];
    (x.blocks||[]).forEach(bl => {
      if (bl.text && bl.text.content) parts.push((bl.text.content||'').replace(PUA,''));
      else if (bl.file && bl.file.meta) parts.push('[attachment] **' + (bl.file.meta.name||'').replace(PUA,'') + '** (' + (bl.file.meta.sizeBytes||'?') + ' bytes)');
      else if (bl.think && bl.think.content) parts.push('<details>\n<summary>Thinking</summary>\n\n' + (bl.think.content||'').replace(PUA,'') + '\n</details>');
    });
    if (parts.length) md += '### ' + role + ' — ' + (x.createTime||'') + '\n' + parts.join('\n\n') + '\n\n';
  });
  save(md, base + '.md', 'text/markdown');
  alert('Done — ' + ord.length + ' messages across ' + pages + ' page(s).\nCheck Downloads for:\n' + base + '.json\n' + base + '.md');
})();
