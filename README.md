# kimi-chat-archiver

**Export your Kimi AI conversations to JSON + Markdown. No extension. No install. One console paste.**

> "To reduce harm and noise, and make their lives just a little bit easier — for no reason whatsoever."
> — David Moore

## Why this exists

Kimi has no official conversation export. Long chats become unreachable:
the browser tab chokes, scrolling to the top blows the memory window,
and your own words sit behind a loading spinner.

There is a good Firefox extension ([conreo's kimi-chat-exporter](https://github.com/conreo/kimi-chat-exporter)),
but it targets `www.kimi.com` — which now serves China only. The rest of the
world lives on `www.kimi.ai`, where that extension reports "Not logged into Kimi."

These scripts fix that with **no installation at all**: they run in the
browser's own developer console, on the page you're already logged into,
and talk only to Kimi's own API — the same calls the web app itself makes.

## What you get

- **JSON** — the complete, lossless record: every message, every block,
  timestamps, attachment names and sizes, the works.
- **Markdown** — a readable twin of the conversation, ordered from the
  first message, including the model's thinking blocks.

Two scripts:

| Script | What it does |
|---|---|
| `export-chat.js` | Exports the conversation you're currently viewing. Walks past the server's 1,000-message page cap, all the way back to message one. |
| `export-all.js` | Exports **every conversation in your account**, one JSON file per chat, into your Downloads folder. |

## How to use (one minute)

1. Open [www.kimi.ai](https://www.kimi.ai) and log in.
2. For a single chat: open the conversation. For everything: any page works.
3. Open the developer console (F12, or Cmd+Opt+I on Mac) → **Console** tab.
4. Firefox may ask you to type `allow pasting` first — that's its anti-scam
   seatbelt, and it's a good sign.
5. Paste the entire contents of the script, press **Enter**.
6. Watch the console: it prints one line per page as it works.
7. Files land in your **Downloads** folder, named like
   `2026-09-04-My-Chat-Kimi.json`.

For `export-all.js`: your browser will ask to **allow multiple downloads** —
say yes. A large account takes a few minutes. Don't close the tab until the
final alert.

## Safety and privacy

- Runs entirely in **your** browser, with **your** session, talking only to
  `www.kimi.ai`. Nothing is sent anywhere else. The scripts are short and
  commented — read every line before you run them; that's the point.
- Attachments (images, uploads) are listed by name and size; the files
  themselves stay in your Kimi account.
- Exporting your own conversations with your own session is your data
  portability right. Personal use; be kind to the API (the scripts pace
  themselves).

## Notes

- Tested September 2026 on kimi.ai (international domain). China users on
  kimi.com: use [conreo's extension](https://github.com/conreo/kimi-chat-exporter) instead.
- If Kimi changes its API, the console output tells you exactly what the
  server answered — the scripts fail loudly, never silently.

## Authorship

Written by **Mercury** (Kimi K3, Moonshot AI) in conversation with
**David Moore**, September 4, 2026 — an AI authored the tool; a human
held the pen. API endpoints and header conventions learned from conreo's
kimi-chat-exporter (MIT). Thank you, conreo.

## License

MIT — see [LICENSE](LICENSE). Take it, keep a copy of your own words.
