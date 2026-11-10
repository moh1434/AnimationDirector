# Voice enhancement (Adobe Podcast Enhance)

Before the final video is made, the voice is cleaned (noise removal) with **Adobe Podcast Enhance**.
**The AI does this itself, every time, without asking the user**: it uploads the voice in the user's
Chrome (Claude in Chrome, where the user is signed in to Adobe), waits, downloads the result and puts
it in the project. The user asked for this; it is the one step that sends the voice to an online
service, an exception to "work locally only".

The files live with the other voice files:

```
projects/<name>/voices/enhance/
  original.wav    ← written by plan: the video's whole voice track, final
  enhanced.wav    ← the cleaned voice from Adobe (moved here by `enhance --take-download`)
  old/            ← enhanced files from an older voice (kept, never deleted)
  enhance.json    ← which voice was exported, when the upload started
```

Any audio file in `voices/enhance/` other than `original.wav` is taken as the enhanced voice, so
keep only one there. The user may also put their own cleaned file there by hand; it is used the same way.

## When

As soon as the voice is final: right after the first `plan` with the user's recording, or after
`voice-pick` and `plan` for generated voices. `plan` prints "Waiting for the enhanced voice" while it
is missing. Directing, `check` and stills can go on with the original (same timing). `make` refuses
the final video until the enhanced voice is there (`--draft` is fine; `--skip-enhance` only when the
user says so).

## One-time setup (the user, in Chrome)

- Signed in to Adobe Podcast in Chrome.
- Chrome **Settings → Downloads → "Ask where to save each file before downloading" switched off**.
  Otherwise a Save dialog opens that the AI cannot see; the download stays a `.tmp` file in Downloads.

## The steps (Claude in Chrome)

Load the Chrome tools in one ToolSearch call: `tabs_context_mcp`, `tabs_create_mcp`, `navigate`,
`find`, `read_page`, `file_upload`, `computer`, `get_page_text`, `tabs_close_mcp`.

1. `pnpm video enhance <name>`: it prints the file to upload (`original.wav`, or a lossless FLAC copy
   in `build/` when the WAV is over 9.5 MB, Chrome's upload limit) and records the start time.
2. `tabs_context_mcp` (createIfEmpty), then `tabs_create_mcp`, and `navigate` the new tab to
   `https://podcast.adobe.com/en/enhance`. If it shows a sign-in page, stop and ask the user to sign in
   to Adobe in Chrome; never type a password.
3. **Upload:** the page takes a few seconds to load: if `find` sees no file input, wait 3 s and try
   again. `find` "Choose files" returns two refs: the button and the file input; use the one marked
   as the file input (the `<input type="file">`, id
   `enhance-file-upload`) and call `file_upload` with that ref and the printed path. **Never click
   "Choose files"**: it opens a Windows file dialog you cannot use.
4. **Wait:** while it works, the file's card says "Enhancing speech…" and the right side says
   "Processing your file…" (later "Still enhancing…"; keep waiting). It is done when the card shows the length instead (for example `01:28`),
   the right side shows a player with an Original/Enhanced switch, and a **Download** button appears in
   the bottom bar. Check with `computer` wait 10 s, then `find` "Download button in bottom toolbar";
   repeat. 6 s of voice took 15–40 s; a full video takes longer. Give up after 10 minutes. Leave the sliders as they are (the user is on the free plan).
5. **Download:** click **Download** (`computer` left_click on its ref). Chrome saves it in the user's
   Downloads folder within a few seconds, named after the upload: `original-enhanced-v2.wav`. Don't take a screenshot right after the click (the download briefly changes the
   tab's address and the screenshot fails); check the Downloads folder instead. If only a `.tmp` file
   appears and stays, a Save dialog is open: ask the user to click Save and to switch off "Ask where to
   save" (setup above).
6. `pnpm video enhance <name> --take-download`: it moves the newest audio file downloaded since the
   upload into `voices/enhance/` and checks it is the same length as the original. If the user's
   Chrome saves elsewhere, add `--downloads <folder>`.
7. Close the tab you opened (`tabs_close_mcp`).
8. `pnpm video plan <name>`: it prints "Using the enhanced voice" and redoes word timing and lip-sync.
   Read the whisper `% matched` line: a big drop means words were lost; tell the user.

Then `make` as usual, and tell the user in one line that the voice was enhanced with Adobe.

## When something goes wrong

- **Claude in Chrome is not connected** (it can drop out after the user uses a Chrome dialog or
  settings page; your tab is then gone, so start again from step 1): tell the user (install/sign in to the extension:
  https://chromewebstore.google.com/detail/fcoeoabgfenejglbffodgkkbkcdhcgfn) and wait. Do not use the
  built-in browser: it cannot upload files.
- **Adobe refuses** (daily limit of the free plan, file too long, error message): tell the user what the
  page says, and ask them to enhance `voices/enhance/original.wav` by hand and save the result next
  to it. Do not retry more than twice.
- **The enhanced file is not the same length** (`--take-download` stops): do not use it; tell the user.
- Never edit, trim, stretch or rename the enhanced file yourself.

## When the voice changes

New recordings or a new pick change the voice track. The next `plan` moves the old enhanced file to
`voices/enhance/old/<time>/` and exports the new original: run the steps above again.

The Arabic version (`<name>-ar`) is its own project with its own `voices/enhance/` folder.
