# Night Drive

A cinematic personal playlist experience built with Next.js, TypeScript, custom responsive CSS, Motion, and YouTube's official IFrame Player API.

## Run it

```bash
npm install
npm run dev
```

Build for production with `npm run build && npm run start`.

## Customize

- Edit [`lib/config.ts`](lib/config.ts) for your name, title, tagline, and playlist name.
- Edit [`data/playlist.ts`](data/playlist.ts) and replace each `youtubeVideoId` with the 11-character ID from your own public YouTube playlist. The playlist URL itself is intentionally not scraped; YouTube does not expose a reliable client-only playlist import for this use case.
- Replace the original visual by placing your own licensed/owned image at `public/images/ferrari-cockpit.jpg`. The included SVG is an original abstract cockpit placeholder and remains as a fallback.

## Import a YouTube playlist

The project includes an official YouTube Data API v3 importer. It retrieves playlist metadata and video IDs only; it never downloads or hosts music.

### Setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project.
2. Enable **YouTube Data API v3** under APIs & Services.
3. Create an API key under Credentials. Restrict it to YouTube Data API usage where practical.
4. Create `.env.local` in the project root:

```text
YOUTUBE_API_KEY=your_key_here
```

`.env.local` is ignored by Git and must never be committed to GitHub. If a key is ever exposed, revoke it and create a replacement.

### Import

Pass a public YouTube or YouTube Music playlist URL. The importer follows every `playlistItems` API page, preserves order, skips deleted/private items, and replaces `data/playlist.ts` only after a successful import:

```bash
npm run import-playlist -- "https://www.youtube.com/playlist?list=PLAYLIST_ID"
npm run import-playlist -- "https://music.youtube.com/playlist?list=PLAYLIST_ID"
```

Run the metadata-only test suite without an API key:

```bash
npm run test:import-playlist
```

The important structure is:

```text
app/                  Next.js shell and global cinematic styling
components/           Scene, player, YouTube mount, and playlist drawer
hooks/                Central player state, IFrame API, keyboard controls
data/playlist.ts      The one playlist source of truth
lib/config.ts         Name, title, tagline, image, playlist identity
public/images/        Replaceable cockpit artwork
```

## Controls

Space play/pause · Left/Right seek · M mute · L playlist · H headlights · F fullscreen. State for track, volume, shuffle, and repeat is persisted in localStorage.

## YouTube limitations

Audio is never downloaded or hosted locally. Browser autoplay policies require the user to press **Enter the drive**. Playback depends on a video being embeddable and available; unavailable videos are reported and skipped. YouTube branding and the iframe remain subject to Google's embedding requirements.

The importer requires a public or API-accessible playlist and consumes YouTube Data API quota. YouTube Music URLs are supported only when they contain a normal YouTube `list` playlist ID; no YouTube Music HTML or private API is used. Video playback remains in the browser through the supported YouTube IFrame Player API.

## In-app playlist loading

Normal usage does not require editing `data/playlist.ts` or running the importer. On the Night Drive entry screen, paste a public YouTube or YouTube Music playlist URL and choose **Load playlist**. The browser sends only that URL to `POST /api/playlist`; the server route reads `YOUTUBE_API_KEY`, fetches playlist metadata and every paginated playlist item, and returns safe track metadata to the player. The API key is never sent to the browser.

The loaded playlist, URL, metadata, and skipped-item count are saved locally so a later visit can restore it. Use **Change playlist** from the entry screen or the drawer, and **Refresh playlist** after editing the playlist on YouTube. The static `data/playlist.ts` remains the fallback when no dynamic playlist has been loaded.

## Deploy

Push the repository to GitHub, import it in Vercel, and deploy with the default Next.js settings. Add `YOUTUBE_API_KEY` in Vercel Project Settings → Environment Variables for the environments where in-app loading should work. Never add it as `NEXT_PUBLIC_YOUTUBE_API_KEY` or commit `.env.local`.

## Drive atmosphere and library

The supplied Ferrari asset folder was inspected and the useful images were copied to `public/images/ferrari/`:

- `night-city.jpg` — nighttime Ferrari city image; poster/fallback for the driving video.
- `road-motion.jpg` — orange Ferrari in motion; alternate open-road scene.
- `road-mobile.jpg` — portrait Ferrari road image; mobile fallback/crop.
- `industrial-detail.jpg` — red Ferrari against an industrial wall; after-hours/detail scene.

Showroom and duplicate exterior images were intentionally not copied. No cockpit interior image was present, so Cockpit Mode remains a HUD presentation mode over the real driving video rather than pretending an exterior photo is an interior.

The atmosphere dock supports the available scenes, Clear/Rain/Fog overlays, Cockpit Mode, Headphone Mode, keyboard help, and safe playlist sharing via a `?playlist=...` URL. The HUD pulse follows real YouTube playback state; it does not claim to analyze raw audio from the cross-origin YouTube iframe.

Favorites and Recently Played are stored locally (favorites by video ID, recent history capped at 30 entries). Playlist search is local and does not make additional API requests. The generated manifest makes Night Drive installable as a standalone PWA; no service worker caches third-party playback or API responses.
