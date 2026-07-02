<div align="center">
<img src="https://img.shields.io/badge/🪙-Tokenz-7c8cff?style=for-the-badge&labelColor=08080c" height="48" alt="Tokenz" />

### A browser extension that lets you drag a file straight into ChatGPT or Claude — parsed on your machine, no upload step, no size limit that stops you.

<br/>

[![License](https://img.shields.io/badge/License-MIT-4ac6a8?style=flat-square)](./LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Chromium-4a8cf7?style=flat-square)](https://chrome.google.com/webstore)
[![Manifest](https://img.shields.io/badge/Manifest-V3-9a7cff?style=flat-square)](./manifest.json)
[![Version](https://img.shields.io/badge/Version-0.4.0-f7a94a?style=flat-square)](./package.json)
[![Status](https://img.shields.io/badge/Status-Unpacked%20install%20only-e05a5a?style=flat-square)](#install)

</div>

---

## What is Tokenz?

Tokenz is a Chrome extension for two websites: **ChatGPT** and **Claude**. It adds one capability neither of them has by default — the ability to drag a document straight onto the chat and have its text land in your message box, ready to send.

There's no upload step, no file attachment icon in the thread, and no server in between. The document is read and converted to text **entirely inside your browser**, by the extension itself.

**Who this is for:** anyone who regularly copy-pastes content from PDFs, Word docs, or web pages into an AI chat and is tired of the manual export → open → select-all → copy → paste routine — or who's hit a wall trying to paste something too large for one message.

## Why use it instead of just uploading the file?

Both ChatGPT and Claude let you attach files natively — but that path has real costs Tokenz avoids:

- **Upload caps by plan.** OpenAI caps free ChatGPT accounts at <cite index="1-1">3 file uploads per day, and Plus/Team accounts at up to 80 files every 3 hours</cite>, with lower limits possible during peak hours. Claude.ai caps every conversation at <cite index="17-1">20 files, with a 30MB per-file size limit</cite>. Hit the cap mid-task, and you're blocked until it resets — Tokenz's drop-and-parse flow isn't a file "upload" at all, so it doesn't touch that quota.
- **Attached files burn your message/usage quota faster.** On Claude specifically, <cite index="18-1">file attachments count against your usage allowance</cite> alongside conversation length — a large PDF can eat through a chunk of your daily limit before you've asked a single question. Because Tokenz sends plain text instead of a file object, it avoids that per-file processing overhead — you're only paying for the tokens the text itself costs, same as if you'd typed it.
- **Processing a native upload costs the model extra work.** Server-side file parsing (rendering PDF pages, running layout analysis, OCR on scans) is real compute the provider bills you for indirectly through your quota. Tokenz does that work locally and hands over clean text, so the model just reads it.

| | Native file upload | Copy-paste by hand | Tokenz |
|---|---|---|---|
| Counts against upload/attachment limits | Yes | No | No — it's typed text, not a file |
| Parsing happens | On the provider's servers, using your quota | You do it manually | In your browser, for free |
| Works past one message's length limit | Depends on the provider | No — you hit the wall and stop | Yes — see below |
| Output in the thread | A file attachment | Raw pasted text, formatting often broken | Clean Markdown, ready to send |

*(Upload limits above are current as of mid-2026 per each provider's own documentation and change without notice — check [OpenAI's file upload FAQ](https://help.openai.com/en/articles/8555545-file-uploads-faq) and Anthropic's help center for the latest numbers.)*

## Quick look

1. Open a chat on **chatgpt.com** or **claude.ai**.
2. Drag a PDF, Word doc, HTML file, or text/Markdown file onto the page.
3. Tokenz reads it locally and types the extracted text into your message box.
4. Send, or keep typing your actual question first.

That's the whole interaction for a normal-sized document. For something too big to fit in one message, keep reading — Tokenz handles that too.

## Features

- **Local, private extraction.** PDF, DOCX, HTML, TXT, and MD are all parsed on-device with open-source libraries — nothing is uploaded just to read a file.
- **Drop or pick, both work.** Tokenz intercepts drag-and-drop *and* the site's native "attach file" button, so however you're used to opening a file, it's caught.
- **Multiple files at once.** Drop a handful of files together and they're combined into a single, clearly labeled message.
- **No hard size ceiling.** Most tools choke or truncate past a single message's limit. Tokenz automatically relays oversized documents across several messages — see [Handling large documents](#handling-large-documents).
- **Live progress, not a black box.** A small on-page status indicator shows which file is being processed and how it's going.
- **On/off switch.** One toggle in the toolbar popup turns interception off entirely, per your preference, with nothing left behind on the page.
- **Optional OCR for scanned PDFs.** If a PDF page has no real text layer, that one page can be run through OCR rather than silently dropped.

## Supported files

| Extension | How it's read |
|---|---|
| `.pdf` | Text layer extracted page-by-page. Pages with no usable text (scans) can fall back to OCR. |
| `.docx` | Converted to clean Markdown. |
| `.html` / `.htm` | Converted to clean Markdown. |
| `.txt` | Used as-is. |
| `.md` | Used as-is. |

Anything else is rejected with a clear message rather than silently mishandled. Standalone images aren't a supported drop target on their own.

## Handling large documents

This is the feature that separates Tokenz from a plain "extract and paste" tool.

Every chat has a practical ceiling on how much text one message can hold. Drop something under that ceiling (roughly 25,000 characters, a little under a novella chapter) and Tokenz just fills your message box — you review it and hit send yourself, same as always.

Drop something bigger — a full book chapter, a long research paper, a 200-page PDF — and manually splitting it into pastable pieces is exactly the kind of tedious work an extension should do for you. So Tokenz does:

1. Splits the document into balanced, paragraph-aware parts.
2. Sends the first part with a short instruction telling the model more is coming and to just acknowledge it.
3. Waits for the model to finish responding.
4. Sends the next part, and repeats until the whole document has gone through.
5. Tells you when it's done, so you can ask your actual question with the full document already in the conversation.

You drop the file once and walk away; Tokenz handles the back-and-forth. It also watches the model's in-between replies — if one runs unexpectedly long instead of a short acknowledgment, you get a warning that it's eating into the context budget the whole process is trying to protect.

## Install

Tokenz isn't published to the Chrome Web Store yet, so it's installed as an unpacked extension:

```bash
git clone https://github.com/beinggravity/tokenz.git
cd tokenz
npm install
npm run build
```

Then in Chrome (or any Chromium-based browser):

1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `tokenz` folder

The Tokenz icon appears in your toolbar, and drag-and-drop becomes active on `chatgpt.com` and `claude.ai`.

## Settings

Click the toolbar icon to open the popup:

- **On/off toggle** — disables file interception entirely when off.
- **OCR API key** — optional. Without one, scanned-PDF OCR falls back to a shared public tier with lower limits; add your own free key from [ocr.space](https://ocr.space) if you rely on OCR often.

## Permissions

Tokenz asks for exactly what the features above need, nothing more:

- `storage` — to remember your settings.
- Access to `chatgpt.com`, `chat.openai.com`, and `claude.ai` — required to add the drag-and-drop behavior to those pages.
- Access to `api.ocr.space` — used only when the OCR fallback for scanned PDF pages is triggered.

## Privacy

Every file type except scanned PDF pages is parsed entirely on-device — nothing is sent anywhere. The one exception: a PDF page with no extractable text layer can be sent to OCR.space for recognition, and only that page, and only when OCR is actually needed. Extracted OCR text is always labeled as "not guaranteed accurate."

## Development

```bash
npm run build   # bundles the extension with esbuild into dist/
npm test        # runs the test suite
```

**Dependencies:** [`mammoth`](https://github.com/mwilliamson/mammoth.js) (DOCX), [`pdfjs-dist`](https://github.com/mozilla/pdf.js) (PDF), [`turndown`](https://github.com/mixmark-io/turndown) (HTML → Markdown). **Dev dependency:** `esbuild`.

<details>
<summary><strong>Project layout</strong></summary>

```
tokenz/
├── icons/, popup/         extension icon assets and toolbar popup UI
├── src/
│   ├── content/           entry points that run on the page (drag/drop capture, orchestration)
│   ├── parsing/           per-file-type parsers and OCR client
│   ├── chunking/          large-document splitting and multi-message delivery logic
│   ├── injection/         per-site adapters for typing into and sending from the compose box
│   ├── background/        service worker (proxies OCR requests, seeds default settings)
│   ├── popup/, shared/    popup logic, settings, formatting helpers
│   └── ui/                on-page status indicator
├── test/                  test suite
├── build.mjs              esbuild build script
└── manifest.json          Manifest V3 config
```

</details>

<details>
<summary><strong>How a drop turns into a message, step by step</strong></summary>

```
you drop a file
      │
      ▼
a script running on the page catches the drop before ChatGPT/Claude's own
upload UI does, and checks the file extension is supported
      │
      ▼
the file is handed to the parsing pipeline, which picks the right parser
for its type (and OCR, if a PDF page needs it)
      │
      ▼
the extracted text is handed to the delivery logic, which decides:
one message, or several with automatic sending in between
      │
      ▼
a small per-site adapter finds the actual compose box and send button
for chatgpt.com or claude.ai and does the typing (and sending, if needed)
```

</details>

## License

[MIT](./LICENSE) © 2026 GRAVITY
