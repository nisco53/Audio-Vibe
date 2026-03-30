
 
─────────────────────────────────────────────────────────
  .env file on your laptop:
    EXPO_PUBLIC_SUPABASE_URL=...
    EXPO_PUBLIC_SUPABASE_ANON_KEY=...
    EXPO_PUBLIC_SPOTIFY_CLIENT_ID=...

  Metro injects these into the JS bundle at build time.
  Anyone who inspects the bundle CAN read EXPO_PUBLIC_ vars.
  ⚠️  Google Books API key was here — now moved to Edge Fn ✅

PRODUCTION
─────────────────────────────────────────────────────────
  EAS Secrets (eas.json / EAS dashboard):
    Same vars set as EAS environment secrets
    Baked into the binary at build time — same exposure level
    for EXPO_PUBLIC_ vars (they are still readable in bundle)

  Supabase anon key: safe to expose (Supabase RLS protects data)
  Spotify client ID: safe to expose (PKCE flow, no secret needed)
  Google Books key: NEVER in app — stays in Supabase Edge Fn ✅
```

---

### 12h. Token Storage (AsyncStorage)

```
DEV
─────────────────────────────────────────────────────────
  Stored in Expo Go's sandboxed AsyncStorage
  Cleared when Expo Go is reinstalled or cache wiped
  Tokens expire after 1 hour — user must reconnect
  ⚠️  No silent refresh implemented yet

PRODUCTION
─────────────────────────────────────────────────────────
  Stored in your app's own sandboxed AsyncStorage
  More persistent — survives app updates
  Still no silent refresh (needs implementing before release)

  Recommended before production:
  ┌────────────────────────────────────────────────────┐
  │  Store refresh_token from Spotify's token response │
  │  When access_token expires:                        │
  │    POST /api/token                                 │
  │    grant_type=refresh_token                        │
  │    → new access_token without user re-login        │
  └────────────────────────────────────────────────────┘
```

---

### 12i. Deep Links (Open in Spotify)

```
DEV
─────────────────────────────────────────────────────────
  Linking.canOpenURL('spotify:show:xxx')
  Works if Spotify is installed on the test device ✅
  Falls back to browser URL if not ✅
  No special config needed for Expo Go

PRODUCTION
─────────────────────────────────────────────────────────
  Same logic works BUT need to declare queried schemes
  in app.json for iOS (required since iOS 9):

  app.json:
  {
    "ios": {
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["spotify"]
      }
    }
  }

  Without this, canOpenURL() always returns false on iOS
  and the app falls back to browser even if Spotify is installed.
```

---

### 12j. Native Modules Available

```
DEV (Expo Go)
─────────────────────────────────────────────────────────
  Limited to modules pre-compiled into Expo Go's binary.
  Currently using:
    ✅ expo-auth-session   (OAuth)
    ✅ expo-web-browser    (in-app browser for OAuth)
    ✅ expo-constants      (app config)
    ✅ AsyncStorage        (token storage)
    ✅ React Native Linking (deep links)

  Cannot add new native modules without a custom build.
  e.g. background audio, push notifications, biometrics
       would require EAS Build.

PRODUCTION (EAS Build)
─────────────────────────────────────────────────────────
  Any native module can be added via package.json
  + EAS Build compiles it into your binary.
  No restrictions.
```

---

### 12k. Full Side-by-Side Summary

| Area | Dev (Expo Go) | Production (EAS Build) |
|------|--------------|------------------------|
| App delivery | JS over LAN from Metro | Bundle inside binary |
| Spotify redirect URI | `exp://192.168.1.x:8081` (dynamic) | `audio-vibe://` (fixed) |
| Spotify URI registration | Re-register when IP changes | Register once |
| Orange dev box | Visible ✅ needed | Remove before release |
| Env vars | `.env` file locally | EAS Secrets in dashboard |
| Google Books key | Supabase Edge Fn ✅ | Supabase Edge Fn ✅ (same) |
| Token persistence | Expo Go sandbox | App's own sandbox |
| Silent token refresh | Not implemented ⚠️ | Must implement ⚠️ |
| Deep links (iOS) | Works without config | Needs `LSApplicationQueriesSchemes` |
| Native modules | Limited to Expo Go set | Unlimited |
| Works offline | No | No (all API-dependent) |
| Requires same Wi-Fi | Yes | No |

---

### 12l. Steps Required to Ship to Production

```
1. EAS Build setup
   npm install -g eas-cli
   eas login
   eas build:configure        ← generates eas.json

2. app.json changes
   - Add "ios.bundleIdentifier": "com.yourname.audiovibe"
   - Add "android.package": "com.yourname.audiovibe"
   - Add "scheme": "audio-vibe"
   - Add LSApplicationQueriesSchemes: ["spotify"]

3. Spotify dashboard
   - Add "audio-vibe://" as a redirect URI

4. Code changes
   - Remove orange devBox from AccountsScreen
   - Implement Spotify token refresh (refresh_token flow)

5. EAS Secrets
   eas secret:create EXPO_PUBLIC_SUPABASE_URL ...
   eas secret:create EXPO_PUBLIC_SUPABASE_ANON_KEY ...
   eas secret:create EXPO_PUBLIC_SPOTIFY_CLIENT_ID ...

6. Build
   eas build --platform ios     ← .ipa for TestFlight/App Store
   eas build --platform android ← .aab for Play Store
```
