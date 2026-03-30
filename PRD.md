# AudioVibe — Product Requirements Document (PRD)

**Version:** 1.0
**Status:** Draft
**Last Updated:** March 2026
**Owner:** nisco53

---

## 1. Overview

### 1.1 Product Summary

AudioVibe is a mobile application that helps people discover the right podcast or audiobook to match how they feel right now. Instead of browsing endless catalogues, users describe their mood, available time, and genre preferences — and AudioVibe surfaces a short, curated list of the most relevant audio content.

### 1.2 Problem Statement

People spend significant time commuting, exercising, or doing chores — windows where audio content fits naturally. However, popular platforms (Spotify, Apple Podcasts, Audible) are catalogue-first: they require users to search, browse, and decide rather than simply answering "what should I listen to right now?"

The core friction is **discovery**, not access. Users know roughly how they feel and how much time they have, but translating that into a good listening choice is cognitively demanding in the moment.

### 1.3 Proposed Solution

A mood-first discovery interface. The user sets:
1. How they feel (mood)
2. How much time they have (duration)
3. What topics interest them (genres, optional)

AudioVibe returns a ranked list of podcasts and audiobooks matched to those inputs — pulling live results from Spotify and Google Books, or from a curated library when those integrations are unavailable.

---

## 2. Goals and Non-Goals

### 2.1 Goals (MVP)

- Allow users to discover audio content in under 30 seconds from app open
- Support 11 mood states covering the full emotional spectrum
- Integrate with Spotify to surface live podcast results from the user's connected account
- Surface audiobook recommendations via Google Books with no login required
- Allow users to filter results to content already in their Spotify library
- Provide a curated fallback library for users without a Spotify account
- Support iOS and Android

### 2.2 Non-Goals (MVP)

- In-app audio playback (content opens in Spotify or browser)
- User accounts or profiles beyond Spotify OAuth
- Social features (sharing, following, likes)
- Offline content caching
- Apple Podcasts, Audible, or other platform integrations
- Personalization based on listening history
- Push notifications

---

## 3. Target Users

### 3.1 Primary: The Commuter

- Age 22–45, urban, working professional
- Uses public transit, drives, or walks 20–60 min/day
- Already a podcast or audiobook listener
- Pain point: wastes 5–10 min each morning deciding what to listen to
- Wants something that matches their energy level for the day ahead

### 3.2 Secondary: The Mood Listener

- Listens during workouts, cooking, or relaxation
- Selects content based on how they feel, not a subscription queue
- May not have a strong podcast following — wants discovery
- Values curation over breadth

---

## 4. User Stories

### Core Discovery Flow

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | User | Select my current mood from a visual grid | The app understands my emotional state |
| US-02 | User | Set how many minutes I have available | Results fit my time window |
| US-03 | User | Filter by one or more genres | Results match my topic interests |
| US-04 | User | Tap "Find My Vibe" | I get a personalized list of content immediately |
| US-05 | User | See podcast and audiobook results together | I have content-type variety in my recommendations |
| US-06 | User | Open a result directly in Spotify | I can start listening without leaving the ecosystem |

### Spotify Integration

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-07 | User | Connect my Spotify account | Results come from Spotify's live catalogue |
| US-08 | User | See which results are already in my Spotify library | I can prioritize content I've saved |
| US-09 | User | Filter results to "My Library Only" | I only see shows I already follow |
| US-10 | User | Disconnect Spotify at any time | I can remove my account connection |

### No-Auth Fallback

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-11 | User | Use the app without logging in | I can try it before connecting accounts |
| US-12 | User | Still get recommendations without Spotify | The app is useful on day one |

---

## 5. Functional Requirements

### 5.1 Home Screen

- **Mood Selector:** Displays all 11 moods in a scrollable grid with emoji and label. Exactly one mood must be selected before searching. Selecting a new mood deselects the previous one.
- **Duration Picker:** Allows selection of commute/listening duration in minutes. Default: 30 min.
- **Genre Selector:** Multi-select from 13 genres. Optional — if none selected, the app searches broadly.
- **Search My Library toggle:** Visible only when Spotify is connected. When enabled, restricts results to the user's saved Spotify shows.
- **Find My Vibe button:** Disabled while loading. Shows a spinner during API calls. Requires mood selection; displays an alert if none is chosen.
- **Spotify status indicator:** A green dot on the accounts icon and a "Live from Spotify + Google Books" chip when connected.

### 5.2 Results Screen

- Displays a list of `Content` items matching the user's filters.
- Shows result count and active filters (duration, mood, genres) in the header.
- Each card shows: title, author/publisher, content type (podcast/audiobook), description, and a "saved to library" badge for Spotify shows already in the user's library.
- **Library filter chip:** Shown when Spotify is connected. Filters list to saved shows only. Shows empty state with a "Show All Results" action if no library matches exist.
- Back button returns to Home without losing filter state.

### 5.3 Accounts Screen

- Shows connection status for Spotify (connected/not connected) and Google Books (always on).
- Spotify Connect: triggers PKCE OAuth flow via `expo-auth-session`. Requests scopes: `user-read-private`, `user-read-email`, `user-library-read`.
- On successful connection: shows Spotify profile (display name, email, follower count).
- Disconnect: confirms with an alert before clearing the stored token.
- Dev helper box: shows the Spotify redirect URI to register in the Spotify Dashboard. (To be removed before production.)

### 5.4 Data Sources and Search Logic

**Mode A — Spotify connected, standard search:**
- Fetches podcasts from `GET /search?type=show` using mood-mapped keywords + selected genre
- Fetches audiobooks via the Supabase `books-search` Edge Function
- Fetches user's saved show IDs and library map in parallel
- Combines podcast and audiobook results

**Mode B — Spotify connected, My Library mode:**
- Fetches user's saved shows from `GET /me/shows`
- Filters client-side by mood keywords and genre keywords against show name + description
- Returns filtered shows only; no Google Books results

**Mode C — No Spotify connection:**
- Queries Supabase `content` table filtered by duration range, mood tags, and genres
- Returns up to 20 results ordered by rating

---

## 6. Content Data Model

```
Content {
  id              string
  title           string
  author          string
  type            'podcast' | 'audiobook'
  genres          Genre[]
  mood_tags       Mood[]
  min_duration    number (minutes)
  max_duration    number (minutes)
  description     string
  cover_color     string (hex)
  rating          number (0–5)
  episode_count   number (optional, podcasts only)
  created_at      ISO datetime
  spotify_id      string (optional)
  spotify_url     string (optional)
}
```

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Search results must render within 3 seconds on a standard LTE connection |
| Availability | App must be usable without Spotify (graceful fallback to Supabase) |
| Security | Google Books API key must never appear in the app bundle |
| Security | Spotify token stored with expiry; expired tokens rejected silently |
| Platforms | iOS 15+ and Android 10+ |
| Accessibility | Text contrast ratios must meet WCAG AA on the dark theme |
| Offline | Not supported at MVP; all features require network access |

---

## 8. Known Limitations (MVP)

| Limitation | Impact | Resolution Path |
|---|---|---|
| Spotify token expires after 1 hour with no silent refresh | User must reconnect manually after ~1 hour | Implement refresh_token flow before v1.1 |
| Genre matching on "My Library" mode is keyword-based | Imprecise — may miss or over-include shows | Improve with Spotify categories endpoint |
| Supabase fallback content is manually curated | Content goes stale without admin intervention | Add content management or periodic sync |
| Only first genre is passed to Spotify search | Multi-genre queries not fully supported | Update Spotify search logic post-MVP |
| Orange dev box visible in dev builds | Minor UX issue in development | Remove before production release |

---

## 9. Roadmap

### v1.0 — Current MVP
- Core mood/genre/duration discovery flow
- Spotify podcast integration (OAuth PKCE)
- Google Books audiobook integration (Edge Function)
- Curated Supabase fallback library
- My Library mode

### v1.1 — Pre-Launch Hardening
- Spotify silent token refresh (refresh_token flow)
- Remove dev helper box from Accounts screen
- EAS production build configuration
- App Store and Google Play submission

### v1.2 — Discovery Improvements
- Multi-genre Spotify search
- Improved "My Library" matching using Spotify categories
- Content card deep link to Spotify app (native URI)
- Empty state improvements with suggested alternatives

### v2.0 — Personalization
- Listening history tracking (opt-in)
- "More like this" recommendations
- Saved vibes (bookmark filter combinations)
- User-created mood playlists

---

## 10. Success Metrics

| Metric | Target (90 days post-launch) |
|---|---|
| D1 retention | > 40% |
| Spotify connection rate | > 50% of active users |
| Search-to-result completion rate | > 80% (user reaches Results screen) |
| Average searches per session | > 1.5 |
| Crash-free session rate | > 99% |
