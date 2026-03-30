# AudioVibe — Software Architecture Design (SAD)

**Version:** 1.0
**Status:** Draft
**Last Updated:** March 2026
**Audience:** Engineers and technical stakeholders

---

## 1. Overview

AudioVibe is a React Native mobile application for mood-based audio content discovery. This document describes the system architecture, component design, data models, API contracts, authentication flows, and deployment strategy.

---

## 2. System Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AudioVibe App                            │
│              (React Native + Expo, iOS & Android)               │
└───────────────────┬─────────────────────┬───────────────────────┘
                    │                     │
          ┌─────────▼──────┐    ┌─────────▼──────────────┐
          │  Spotify API   │    │       Supabase          │
          │  (Web API v1)  │    │  ┌─────────────────┐   │
          │                │    │  │ Postgres DB      │   │
          │  - Search shows│    │  │ (content table)  │   │
          │  - User library│    │  └─────────────────┘   │
          │  - User profile│    │  ┌─────────────────┐   │
          │  - OAuth PKCE  │    │  │ Edge Function    │   │
          └────────────────┘    │  │ (books-search)   │   │
                                │  └────────┬────────┘   │
                                └───────────┼────────────┘
                                            │
                                 ┌──────────▼──────────┐
                                 │  Google Books API   │
                                 │  (volumes endpoint) │
                                 └─────────────────────┘
```

**Key architectural decision:** The Google Books API key is never exposed in the app bundle. It lives exclusively as a Supabase Edge Function secret, accessed server-side through the `books-search` function. The app calls Supabase; Supabase calls Google.

---

## 3. Application Architecture

### 3.1 Navigation Model

AudioVibe uses a custom screen-state router in `App.tsx` rather than a navigation library (React Navigation). This is intentional for MVP simplicity — there are only 3 screens.

```
App.tsx (state: Screen = 'home' | 'results' | 'accounts')
├── HomeScreen         — default screen
├── ResultsScreen      — rendered after search
└── AccountsScreen     — rendered from settings icon
```

Screen transitions are synchronous state updates. No animation library is used at MVP. Data (results, filters) is passed as props from `App.tsx` down to child screens.

### 3.2 Component Tree

```
App
├── HomeScreen
│   ├── DurationPicker
│   ├── MoodSelector
│   ├── GenreSelector
│   └── [Library toggle — conditional on Spotify connection]
├── ResultsScreen
│   ├── [Library filter chip — conditional on savedSpotifyIds]
│   └── FlatList → ContentCard[]
└── AccountsScreen
    ├── [Spotify card]
    └── [Google Books card]
```

### 3.3 State Management

No global state library (Redux, Zustand, etc.) is used. State flows as follows:

| State | Lives in | Passed to |
|---|---|---|
| Current screen | `App.tsx` | N/A (controls rendering) |
| Search results | `App.tsx` | `ResultsScreen` (props) |
| Active filters | `App.tsx` | `ResultsScreen` (props) |
| Duration | `HomeScreen` local | Passed up via `onResults` |
| Mood | `HomeScreen` local | Passed up via `onResults` |
| Genres | `HomeScreen` local | Passed up via `onResults` |
| Spotify connected | `HomeScreen` local | Derived from `getSpotifyToken()` |
| Library-only toggle | `ResultsScreen` local | Filters `displayResults` |
| Spotify profile | `AccountsScreen` local | N/A |

---

## 4. Module Design

### 4.1 `lib/types.ts` — Shared Type Definitions

The single source of truth for domain types shared across screens and lib modules.

```typescript
type ContentType = 'podcast' | 'audiobook'

type Mood =
  'focused' | 'energized' | 'relaxed' | 'curious' | 'motivated' |
  'reflective' | 'happy' | 'calm' | 'tired' | 'drained' | 'anxious'

type Genre =
  'True Crime' | 'Comedy' | 'Self-Help' | 'Technology' | 'Business' |
  'Science' | 'History' | 'Fiction' | 'Health & Fitness' |
  'Society & Culture' | 'News' | 'Sports' | 'Arts'

interface Content {
  id: string
  title: string
  author: string
  type: ContentType
  genres: Genre[]
  mood_tags: Mood[]
  min_duration: number       // minutes
  max_duration: number       // minutes
  description: string
  cover_color: string        // hex
  rating: number             // 0–5
  episode_count?: number     // podcasts only
  created_at: string         // ISO 8601
  spotify_id?: string
  spotify_url?: string
}

interface FilterState {
  duration: number
  mood: Mood | null
  genres: Genre[]
  savedSpotifyIds?: string[]
  spotifyLibraryMap?: Record<string, string>  // showId → playlist name
}
```

### 4.2 `lib/spotify.ts` — Spotify Web API Client

Handles all communication with the Spotify Web API.

**Functions:**

| Function | Endpoint | Purpose |
|---|---|---|
| `searchSpotifyPodcasts(token, mood, genres)` | `GET /search?type=show` | Search Spotify catalogue by mood+genre keywords |
| `getUserSavedShows(token)` | `GET /me/shows` | Fetch all saved shows (up to 50) |
| `getUserSavedShowIds(token)` | `GET /me/shows` | Returns `Set<string>` of saved show IDs |
| `getUserShowLibraryMap(token)` | `GET /me/shows` + `GET /me/playlists` | Maps showId → playlist/library name |
| `filterSavedShowsByMoodAndGenre(shows, mood, genres)` | Client-side | Keyword filter for My Library mode |
| `getSpotifyShowEpisodes(token, showId, durationMs)` | `GET /shows/{id}/episodes` | Fetch episodes filtered by duration (±10 min) |

**Mood-to-keyword mapping (used in search queries):**

```
focused    → "focus productivity deep work"
energized  → "energy motivation"
relaxed    → "relaxing calm"
curious    → "learning education curious"
motivated  → "motivational success"
reflective → "mindfulness reflection"
happy      → "comedy funny upbeat"
calm       → "calm peaceful meditation"
tired      → "soothing gentle easy"
drained    → "restorative healing gentle"
anxious    → "anxiety calm soothing"
```

### 4.3 `lib/googlebooks.ts` — Google Books Client

Calls the Supabase `books-search` Edge Function. The API key never touches the client.

```typescript
searchAudiobooks(mood: Mood, genres: string[]): Promise<GoogleBook[]>
// Invokes: supabase.functions.invoke('books-search', { body: { mood, genres } })
```

### 4.4 `lib/supabase.ts` — Supabase Client

Initializes the Supabase JS client with AsyncStorage as the session store.

```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // required for React Native
  }
})
```

### 4.5 `lib/tokens.ts` — Spotify Token Storage

Manages Spotify access token persistence using AsyncStorage.

```typescript
saveSpotifyToken(token: string, expiresIn: number): Promise<void>
// Stores token + computed expiry timestamp

getSpotifyToken(): Promise<string | null>
// Returns token if present and not expired; null otherwise

clearSpotifyToken(): Promise<void>
// Removes token and expiry from AsyncStorage
```

**Storage keys:** `spotify_access_token`, `spotify_token_expiry`

> **Known gap:** The `refresh_token` is not stored. When the access token expires (~1 hour), the user must re-authenticate manually. Implementing the refresh_token flow is a pre-launch requirement.

---

## 5. Backend Architecture

### 5.1 Supabase Database

**Table: `content`**

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `title` | text | Content title |
| `author` | text | Author or publisher |
| `type` | text | `'podcast'` or `'audiobook'` |
| `genres` | text[] | Array of Genre values |
| `mood_tags` | text[] | Array of Mood values |
| `min_duration` | int | Minimum episode duration (minutes) |
| `max_duration` | int | Maximum episode duration (minutes) |
| `description` | text | Short description |
| `cover_color` | text | Hex color for UI display |
| `rating` | float | Content rating (0–5) |
| `episode_count` | int | Nullable — podcasts only |
| `spotify_id` | text | Nullable — Spotify show ID |
| `spotify_url` | text | Nullable — Spotify URL |
| `created_at` | timestamptz | Creation timestamp |

**Query pattern (Mode C — no Spotify):**
```sql
SELECT * FROM content
WHERE min_duration <= :duration
  AND max_duration >= :duration
  AND mood_tags @> ARRAY[:mood]
  AND (genres && ARRAY[:genres] OR :genres = '{}')
ORDER BY rating DESC
LIMIT 20;
```

### 5.2 Supabase Edge Function: `books-search`

Runtime: Deno
Trigger: HTTP POST from client via `supabase.functions.invoke()`

**Request body:**
```json
{ "mood": "focused", "genres": ["Technology"] }
```

**Response:** Array of Google Books `Volume` objects (up to 10)

**Internal logic:**
1. Reads `GOOGLE_BOOKS_KEY` from Deno environment (never exposed to client)
2. Builds query: `{moodKeywords} {firstGenre} audiobook`
3. Calls `https://www.googleapis.com/books/v1/volumes`
4. Returns `data.items ?? []`

**Mood-to-query mapping (Edge Function):**
```
focused    → "productivity focus"
energized  → "motivation success"
relaxed    → "relaxing fiction"
curious    → "science discovery"
motivated  → "self improvement"
reflective → "memoir philosophy"
happy      → "humor comedy"
calm       → "mindfulness wellness"
tired      → "short stories easy"
drained    → "healing wellness"
anxious    → "anxiety calm mindfulness"
```

---

## 6. Authentication Flow

### 6.1 Spotify OAuth 2.0 PKCE Flow

```
User taps "Connect Spotify"
        │
        ▼
expo-auth-session generates code_verifier + code_challenge (PKCE)
        │
        ▼
Opens https://accounts.spotify.com/authorize
  ?client_id=...
  &response_type=code
  &redirect_uri=audio-vibe://  (or exp://... in dev)
  &scope=user-read-private user-read-email user-library-read
  &code_challenge=...
  &code_challenge_method=S256
        │
        ▼
User logs in and approves in Spotify web browser
        │
        ▼
Spotify redirects to redirect_uri with ?code=...
        │
        ▼
App receives code via expo-auth-session response
        │
        ▼
POST https://accounts.spotify.com/api/token
  grant_type=authorization_code
  code=...
  redirect_uri=...
  client_id=...
  code_verifier=...  ← proves app identity without a client secret
        │
        ▼
Spotify returns { access_token, expires_in, refresh_token }
        │
        ▼
saveSpotifyToken(access_token, expires_in)
  → stored in AsyncStorage with expiry timestamp
        │
        ▼
Fetch /v1/me → display profile in AccountsScreen
```

**Scopes requested:**
- `user-read-private` — read display name, country
- `user-read-email` — read email address
- `user-library-read` — read saved shows/podcasts

**Redirect URIs:**
- Development: `exp://192.168.x.x:8081` (dynamic — changes with local IP)
- Production: `audio-vibe://` (fixed; registered once in Spotify Dashboard)

### 6.2 Google Books (No Auth)

Google Books API is called server-side from the Supabase Edge Function. The client never holds an API key. No user authentication is required.

### 6.3 Supabase (Anon Key)

The Supabase anon key is safe to expose in the app bundle — it provides access to public data only. Row Level Security (RLS) on the `content` table prevents unauthorized writes. No user sign-in is implemented at MVP.

---

## 7. Data Flow Diagrams

### 7.1 Standard Search (Spotify connected)

```
HomeScreen.handleFind()
        │
        ├── getSpotifyToken()  →  AsyncStorage
        │
        ├── searchSpotifyPodcasts(token, mood, genres)
        │     └── GET /v1/search?type=show  →  Spotify API
        │
        ├── searchAudiobooks(mood, genres)
        │     └── supabase.functions.invoke('books-search')
        │           └── GET googleapis.com/books/v1/volumes  →  Google Books
        │
        ├── getUserSavedShowIds(token)
        │     └── GET /v1/me/shows  →  Spotify API
        │
        └── getUserShowLibraryMap(token)
              ├── GET /v1/me/shows  →  Spotify API
              └── GET /v1/me/playlists + /playlists/{id}/tracks  →  Spotify API
                        │
                        ▼
              Merge results → Content[]
                        │
                        ▼
              App.handleResults(results, filters)
                        │
                        ▼
              Navigate to ResultsScreen
```

### 7.2 My Library Mode

```
HomeScreen.handleFind() [searchMyLibrary = true]
        │
        ├── getUserSavedShows(token)  →  GET /v1/me/shows
        ├── getUserSavedShowIds(token)
        └── getUserShowLibraryMap(token)
                    │
                    ▼
        filterSavedShowsByMoodAndGenre(shows, mood, genres)
          [client-side keyword matching on show.name + show.description]
                    │
                    ▼
        Map to Content[] → ResultsScreen
```

### 7.3 Fallback Mode (No Spotify)

```
HomeScreen.handleFind() [no token]
        │
        ▼
supabase.from('content').select('*')
  .lte('min_duration', duration)
  .gte('max_duration', duration)
  .contains('mood_tags', [mood])
  [.overlaps('genres', genres) — if genres selected]
  .order('rating', { ascending: false })
  .limit(20)
        │
        ▼
Content[] → ResultsScreen
```

---

## 8. Security Model

| Asset | Where stored | Exposure level |
|---|---|---|
| Supabase URL | `.env` / EAS Secret | Low risk — project URL is not sensitive |
| Supabase anon key | `.env` / EAS Secret | Low risk — RLS enforced; no user data exposed |
| Spotify client ID | `.env` / EAS Secret | Low risk — PKCE flow requires no client secret |
| Spotify access token | AsyncStorage (sandboxed) | Medium — expires in 1h; no refresh token stored |
| Google Books API key | Supabase Edge Function env | Secure — never in app bundle |

**EXPO_PUBLIC_ prefix:** Variables prefixed with `EXPO_PUBLIC_` are embedded in the JavaScript bundle at build time and readable by anyone who inspects the bundle. This is acceptable for the Supabase anon key (protected by RLS) and Spotify client ID (PKCE requires no secret). It is not acceptable for the Google Books key — hence the Edge Function proxy.

---

## 9. Environment Configuration

### Development

```
.env (local)
  EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  EXPO_PUBLIC_SPOTIFY_CLIENT_ID=abc123

Supabase Edge Function secret (set via Supabase dashboard or CLI):
  GOOGLE_BOOKS_KEY=AIza...

Spotify Developer Dashboard:
  Redirect URI: exp://192.168.x.x:8081  ← re-register when IP changes
```

### Production (EAS Build)

```
EAS Secrets (set via `eas secret:create` or EAS dashboard):
  EXPO_PUBLIC_SUPABASE_URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY
  EXPO_PUBLIC_SPOTIFY_CLIENT_ID

Spotify Developer Dashboard:
  Redirect URI: audio-vibe://  ← register once, permanent

Supabase Edge Function secret:
  GOOGLE_BOOKS_KEY  ← unchanged from dev
```

---

## 10. Build and Deployment

### Development

```bash
npx expo start          # starts Metro bundler + QR code for Expo Go
```

### Production Build (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure     # generates eas.json (already present)

eas build --platform ios       # produces .ipa for TestFlight / App Store
eas build --platform android   # produces .aab for Google Play
```

**App identifiers:**
- iOS bundle ID: `com.audiovibe.app`
- Android package: `com.audiovibe.app`
- EAS project ID: `5a48b076-d21d-456d-b749-ec2aa63a5dc5`
- Deep link scheme: `audio-vibe`

**iOS-specific config (app.json):**
```json
"LSApplicationQueriesSchemes": ["spotify"]
```
Required for `Linking.canOpenURL('spotify:...')` to work on iOS 9+. Without it, the app always falls back to the browser URL even when Spotify is installed.

---

## 11. Known Technical Debt

| Issue | Severity | Resolution |
|---|---|---|
| No Spotify token refresh | High — users must re-auth hourly | Implement refresh_token PKCE flow before production |
| Only first genre passed to Spotify search | Medium — reduces result relevance | Extend `searchSpotifyPodcasts` to use multiple genre terms |
| My Library keyword matching is fuzzy | Medium — imprecise filtering | Use Spotify show categories endpoint for structured matching |
| No error boundary at app root | Medium — unhandled errors crash silently | Add React error boundary wrapping all screens |
| Orange dev box in AccountsScreen | Low — cosmetic | Remove `devBox` block before production build |
| `getUserShowLibraryMap` makes N+1 requests | Low — one request per playlist | Batch or paginate playlist track fetches |

---

## 12. Dependencies

| Package | Version | Purpose |
|---|---|---|
| `expo` | ~54.0.33 | Mobile framework |
| `react-native` | 0.81.5 | UI layer |
| `react` | 19.1.0 | Component model |
| `@supabase/supabase-js` | ^2.99.2 | Database + Edge Function client |
| `expo-auth-session` | ~7.0.10 | Spotify OAuth PKCE |
| `expo-web-browser` | ~15.0.10 | In-app browser for OAuth |
| `expo-crypto` | ~15.0.8 | PKCE code challenge generation |
| `@react-native-async-storage/async-storage` | 2.2.0 | Token persistence |
| `expo-linear-gradient` | ~15.0.8 | UI gradients |
| `expo-constants` | ~18.0.13 | App config access |
| `typescript` | ^5.3.0 | Type safety |
