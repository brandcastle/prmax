# PR Max

A personal weight-training log. One HTML file, no server, no account.

Live at: https://brandcastle.github.io/prmax/

## What it does

- **Train** — pick one of your program's days, work through its exercises, log sets one at a
  time.
- **Programs** — a training block: a split, its days, and the exercises in each day. One is
  current at a time. Start a new block from a copy, from a ready-made split, or empty. Switching
  blocks never touches a set you have logged, and your progression carries across, because that
  follows the exercise rather than the program.
- **Double progression** — hold the load until you hit the top of the rep range on two sets,
  then add weight. The app tracks this per exercise and tells you when you've earned the jump,
  or flags a lift as stalled.
- **Effort** — rate each exercise 1–10 when you finish it. A session you rated all out holds the
  load instead of adding to it; one you rated easy can move the weight up sooner. It shows you
  what the rating will do before you commit it, and nothing changes until you start rating.
- **Volume** — direct sets per muscle for the current calendar week, against targets you set,
  with secondary work counted separately.
- **Log** — a calendar of training days and a session list. Any past session can be edited:
  change a set's weight or reps, add one you forgot, or drop an exercise.
- **Setup** — your programs and their days, weekly targets, rest timer, name, and theme.

## Where the data lives

In your browser's local storage, on the device you're using. Nothing is uploaded, and there is
no account or server.

Two consequences worth knowing:

1. **Storage is per-address.** This site and any other copy of the app keep completely separate
   logs. They do not sync.
2. **Clearing your browser data deletes your log.** There is no other copy.

So: **Setup → Copy backup** now and then, and paste that text somewhere safe. Setup → Restore
puts it back, including onto a new device.

## Adding it to an iPhone

Open the URL in Safari → Share → **Add to Home Screen**. It then opens full-screen like an app
and works without a connection.

## Notes

- `robots.txt` and a `noindex` tag keep this out of search results.
- Nothing personal is in this repository — it holds the app, not the training data.
- **Never commit a Google Sheets web-app URL or any other secret here.** This repo is public.

## Google Sheet sync (optional)

`sheet-sync.gs` mirrors your log into a private Google Sheet: sets you log appear, sessions you
delete disappear.

1. Make a new Google Sheet.
2. **Extensions → Apps Script**, replace everything with `sheet-sync.gs`. Edit `setSecret()`
   to your own long random string, run it once from the editor, then blank the string back
   out and save — the secret lives in Script Properties, not in the file.
3. **Deploy → New deployment → Web app** — *Execute as: Me*, *Who has access: Anyone*. Copy the
   `/exec` URL.
4. In PR Max: **Setup → Google Sheet** — paste the URL and the same secret, then **Sync now**.

"Anyone" is required because the app sends a plain request with no Google login. What protects
the data instead: the script has **no read path** — no `doGet`, nothing that returns rows — so
the URL cannot be used to read your log, only to write. Every request must also carry the
secret. The Sheet itself stays private to your Google account.

**Never set the Sheet itself to "anyone with the link can view."** No code here can protect
you from that, and it would make everything public.

**The URL and secret live only on your phone.** They are stripped from the Setup → Copy backup
text, and must never be committed here.

## Credits

Exercise reference data (names, muscle groups, equipment) adapted from
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset),
MIT licensed.

Data only. The images and GIFs in that repository are © Gym visual
(https://gymvisual.com/) under separate terms and are **not** used here.

MIT License

Copyright (c) hasaneyldrm

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
