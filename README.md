# SEVENTY-FIVE — a 75 Hard companion

A private, on-device iPhone app for the 75 Hard challenge. No App Store, no accounts, no
servers — it installs straight from Safari as a full-screen app and everything stays on
the phone.

## The rules it enforces

Every day, six commitments. Miss one and the count returns to Day One — the app checks
every past day and calls it.

1. **First workout** — 45 minutes, proof photo required
2. **Second workout** — 45 minutes outdoors, proof photo required
3. **One gallon of water** — logged ounce by ounce with a tracker
4. **Read ten pages** — non-fiction, with a photo of the pages and a book tracker
5. **Hold the diet** — no alcohol, no slips
6. **Progress photo** — every day, collected into a timeline

House rule: **ten cheat-meal passes** per attempt for genuine occasions (a wedding, a
birthday). Each one is logged with its occasion and shown as spent.

## Features

- **Proof or it didn't happen** — workouts and reading can't be checked off until a
  photo/screenshot is attached (can be relaxed in settings). Photos are compressed and
  stored on-device in IndexedDB.
- **The failure engine** — open the app after an unfinished day and it confronts you:
  back to Day One. Yesterday can be retro-completed honestly (proofs still required);
  anything older cannot.
- **Couples mode** — do it together. Choose *Bound together* (one misses, both restart)
  or *Side by side*. Works on one phone (tap your partner's list) or two phones: each
  day you "Share my day", which sends a compact day-code over iMessage/WhatsApp that
  your partner pastes into their app.
- **Book tracker** — current book with page progress, finished shelf, all-time pages.
- **Journey** — the 75-day chain, stats, attempt history, and your progress-photo
  timeline.
- **Backups** — export/import your log as JSON.
- Works fully offline once installed; installable PWA with app icon.

## Getting it on iPhones (free, no App Store)

The app is plain static files — host it anywhere with HTTPS. The easiest free way is
GitHub Pages, and this repo already ships the workflow:

1. Merge this branch into `main`.
2. In the repo: **Settings → Pages → Source → GitHub Actions**.
3. Push (or re-run the "Deploy to GitHub Pages" workflow). The app goes live at
   `https://<username>.github.io/75-hard/`.

Then, on any iPhone:

1. Open that link in **Safari**.
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. Launch it from the icon — full screen, offline, camera-enabled for proofs.

Share the link with as many people as you like; every phone keeps its own private data.

> **Note:** because data lives in Safari's storage for the installed app, deleting the
> icon deletes the data. Use *More → Export backup* before switching phones.

## Development

No build step. Serve the folder and open it:

```sh
python3 -m http.server 8000
# or: npx serve .
```

Icons are generated from code:

```sh
node tools/make-icons.mjs
```

## Stack

Vanilla HTML/CSS/JS. `localStorage` for state, IndexedDB for photos, a service worker
for offline. Nothing leaves the device.
