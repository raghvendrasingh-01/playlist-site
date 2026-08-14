# Ferrari Night Drive

A cinematic personal music player that combines YouTube playlists with a Ferrari night-drive experience.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://vercel.com/)

## 🚗 Live Demo

[**Open Ferrari Night Drive →**](https://playlist-site-fdz9zt3et-raghvendra-singhs-projects-36b5f2fa.vercel.app/)

[**GitHub Repository →**](https://github.com/raghvendrasingh-01/playlist-site)

## Features

- Cinematic, continuously looping Ferrari driving video with high-quality image fallbacks
- YouTube and YouTube Music playlist URL loading through the YouTube Data API v3
- Music playback through the official YouTube IFrame Player API
- Real playback progress, seeking, play/pause, previous/next, shuffle, and repeat
- Volume and mute controls
- Scrollable playlist drawer with search
- Favorites and Recently Played collections
- Multiple drive scenes with clear, rain, and fog weather effects
- Cockpit Mode, Headphone Mode, headlights, and fullscreen
- Keyboard controls and in-app shortcut help
- Playlist sharing through playlist IDs
- `localStorage` persistence for playlist data, library state, and player preferences
- Responsive glassmorphism interface for desktop and mobile
- Installable PWA manifest

## Technology Stack

| Technology | Role |
| --- | --- |
| Next.js 16 | Application framework, routing, and server API route |
| React 19 | Interactive player interface |
| TypeScript 5.9 | Type-safe application code |
| Motion | Interface animation and transitions |
| Lucide React | Interface icons |
| YouTube Data API v3 | Playlist metadata and track retrieval |
| YouTube IFrame Player API | Music playback and player controls |
| CSS | Responsive styling, glassmorphism, and visual effects |
| Vercel | Production deployment |

## How It Works

```text
User
  ↓
YouTube / YouTube Music playlist URL
  ↓
Next.js server API route
  ↓
YouTube Data API v3
  ↓
Playlist metadata + tracks
  ↓
Night Drive music player
```

The Ferrari video is visual-only. YouTube provides the actual music playback through its official IFrame Player API.

```text
Ferrari video
  ↓
Cinematic background
  ↓
Glassmorphism player UI
```

## YouTube API Security

`YOUTUBE_API_KEY` is a server-side credential read only by the playlist API route.

- Store it in `.env.local` for local development.
- Add it as an Environment Variable in Vercel for deployment.
- Do **not** use `NEXT_PUBLIC_YOUTUBE_API_KEY`; that prefix would expose the key to browser code.
- Never commit the key or `.env.local` to GitHub.

```env
YOUTUBE_API_KEY=your_api_key_here
```

## Local Development

```bash
git clone https://github.com/raghvendrasingh-01/playlist-site.git
cd playlist-site
npm install
```

Create `.env.local` in the project root and add:

```env
YOUTUBE_API_KEY=your_api_key_here
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Build

```bash
npm run build
npm run start
```

## Playlist Usage

Paste either supported public playlist URL format into the application:

```text
https://www.youtube.com/playlist?list=PLAYLIST_ID
https://music.youtube.com/playlist?list=PLAYLIST_ID
```

The browser sends the URL to `POST /api/playlist`. The secure server route extracts the playlist ID and fetches its metadata and tracks through the YouTube Data API v3. The application does not scrape YouTube.

## Project Structure

```text
app/
└── api/playlist/route.ts       # Server-side YouTube playlist endpoint
components/
├── NightDrive.tsx              # Main night-drive experience
├── DrivingBackground.tsx       # Ferrari visuals and fallback handling
└── PlaylistDrawer.tsx          # Playlist, search, favorites, and history
data/
└── scenes.ts                   # Drive scenes and their visual assets
hooks/
├── useMusicPlayer.ts           # Playback state and controls
├── useDynamicPlaylist.ts       # Runtime playlist loading and persistence
└── useDriveLibrary.ts          # Favorites and Recently Played
lib/                            # Shared configuration and YouTube utilities
public/                         # Ferrari media and PWA assets
scripts/                        # Playlist import tooling and tests
types/                          # YouTube IFrame API types
```

## Ferrari Visual Assets

The default Night Drive scene uses `public/videos/ferrari-night-drive.mp4`. Scene imagery is stored under `public/images/ferrari/`, with separate landscape and mobile-friendly assets where appropriate.

```text
Ferrari video → scene image / video poster → original fallback artwork
```

If the video cannot load, `DrivingBackground.tsx` reveals the configured Ferrari scene image. The entry experience also retains the original `public/images/ferrari-cockpit.svg` artwork as its fallback asset.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Space` | Play / Pause |
| `←` / `→` | Seek backward / forward 10 seconds |
| `↑` / `↓` | Raise / lower volume by 5% |
| `M` | Mute / unmute |
| `L` | Toggle playlist drawer |
| `S` | Toggle shuffle |
| `R` | Toggle repeat |
| `H` | Toggle headlights |
| `F` | Toggle fullscreen |
| `?` | Open shortcut help |

Previous and next track controls are also available directly in the player interface.

## Design

**Ferrari night drive meets cinematic music player.** The interface combines a cinematic Ferrari background, dark night palette, Ferrari-red accents, layered glassmorphism, responsive controls, and an automotive-inspired HUD.

## Privacy & Security

- The YouTube API key remains server-side and is never returned to the browser.
- No music is downloaded or hosted; playback uses the official YouTube IFrame Player API.
- Playlist sharing places only the playlist ID in the shared URL.
- `localStorage` contains playlist and preference data, not API credentials.

## Deployment

Ferrari Night Drive is deployed on Vercel:

**https://playlist-site-fdz9zt3et-raghvendra-singhs-projects-36b5f2fa.vercel.app/**

For another Vercel deployment, import the GitHub repository and configure `YOUTUBE_API_KEY` at:

```text
Vercel → Project Settings → Environment Variables
```

Redeploy after adding the variable so the server-side playlist route can access it.
