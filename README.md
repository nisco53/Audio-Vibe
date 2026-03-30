# 🎧 AudioVibe

**The perfect listen for your commute.**

AudioVibe is a mood-based audio discovery app built with React Native and Expo. Tell it how you're feeling, pick your genres and available time, and it surfaces podcasts from Spotify and audiobooks from Google Books — or falls back to a curated library when you're offline.

---

## Features

- **Mood-first discovery** — 11 moods (focused, energized, relaxed, curious, motivated, reflective, happy, calm, tired, drained, anxious)
- **Genre filtering** — 13 genres including True Crime, Self-Help, Technology, Fiction, and more
- **Duration picker** — match content to your available commute time
- **Live Spotify integration** — connect your account to get real-time podcast results from Spotify's catalogue
- **My Library mode** — filter results to only shows already saved in your Spotify library
- **Google Books audiobooks** — always-on audiobook recommendations via a secure Supabase Edge Function
- **Curated fallback** — Supabase-hosted content library used when Spotify is not connected

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript |
| Backend / DB | Supabase (Postgres + Edge Functions) |
| Podcast data | Spotify Web API |
| Audiobook data | Google Books API (via Supabase Edge Function) |
| Auth | Spotify OAuth 2.0 PKCE via `expo-auth-session` |
| Token storage | `@react-native-async-storage/async-storage` |
| Build / deploy | Expo EAS Build |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A [Supabase](https://supabase.com) project
- A [Spotify Developer](https://developer.spotify.com/dashboard) app with PKCE enabled

### 1. Clone and install

```bash
git clone https://github.com/nisco53/Audio-Vibe.git
cd Audio-Vibe
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
```

> The Google Books API key is **never stored in the app**. It lives securely in a Supabase Edge Function secret.

### 3. Register your Spotify redirect URI

Start the app once and copy the redirect URI shown in the orange dev box on the Accounts screen (e.g., `exp://192.168.1.x:8081`). Register it in your Spotify Developer Dashboard under **Redirect URIs**.

> The URI changes whenever your local IP changes. Re-register when it does.

### 4. Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS or Android).

---

## Project Structure

```
Audio vibe/
├── App.tsx                  # Root component and screen router
├── screens/
│   ├── HomeScreen.tsx       # Mood, genre, duration selection + search trigger
│   ├── ResultsScreen.tsx    # Recommendation list with library filter
│   └── AccountsScreen.tsx   # Spotify OAuth connect/disconnect
├── components/
│   ├── ContentCard.tsx      # Individual result card
│   ├── MoodSelector.tsx     # Mood picker UI
│   ├── GenreSelector.tsx    # Genre multi-select UI
│   └── DurationPicker.tsx   # Commute duration slider/picker
├── lib/
│   ├── spotify.ts           # Spotify Web API client
│   ├── googlebooks.ts       # Google Books client (calls Edge Function)
│   ├── supabase.ts          # Supabase client init
│   ├── tokens.ts            # Spotify token storage helpers
│   └── types.ts             # Shared TypeScript types
├── constants/
│   ├── moods.ts             # Mood definitions
│   └── genres.ts            # Genre definitions
└── supabase/
    └── functions/
        └── books-search/    # Deno Edge Function — Google Books proxy
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (safe to expose; RLS protects data) |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` | Yes | Spotify app client ID (safe; PKCE requires no secret) |
| `GOOGLE_BOOKS_KEY` | Server only | Set as Supabase Edge Function secret — never in the app |

---

## Deploying to Production

Refer to [SYSTEM_DIAGRAM.md](SYSTEM_DIAGRAM.md) for the full production checklist including EAS Build setup, Spotify redirect URI registration for production, token refresh implementation, and App Store submission steps.

---

## Status

Early MVP — core discovery flow is functional end-to-end. See [PRD.md](PRD.md) for the full roadmap.

---

## License

Private repository. All rights reserved.
