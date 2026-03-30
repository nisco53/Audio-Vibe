import { Mood } from './types';

const SPOTIFY_API = 'https://api.spotify.com/v1';

// Map moods to Spotify search keywords
const moodToQuery: Record<Mood, string> = {
  focused: 'focus productivity deep work',
  energized: 'energy motivation',
  relaxed: 'relaxing calm',
  curious: 'learning education curious',
  motivated: 'motivational success',
  reflective: 'mindfulness reflection',
  happy: 'comedy funny upbeat',
  calm: 'calm peaceful meditation',
  tired: 'soothing gentle easy',
  drained: 'restorative healing gentle',
  anxious: 'anxiety calm soothing',
};

export interface SpotifyShow {
  id: string;
  name: string;
  publisher: string;
  description: string;
  images: { url: string }[];
  total_episodes: number;
  external_urls: { spotify: string };
}

export async function searchSpotifyPodcasts(
  accessToken: string,
  mood: Mood,
  genres: string[]
): Promise<SpotifyShow[]> {
  const moodQuery = moodToQuery[mood];
  const genreQuery = genres.length > 0 ? genres[0] : '';
  const query = `${moodQuery} ${genreQuery}`.trim();

  const res = await fetch(
    `${SPOTIFY_API}/search?q=${encodeURIComponent(query)}&type=show&market=US&limit=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) throw new Error('Spotify search failed');

  const data = await res.json();
  return data.shows?.items ?? [];
}

export async function getUserSavedShows(accessToken: string): Promise<SpotifyShow[]> {
  try {
    const res = await fetch(`${SPOTIFY_API}/me/shows?limit=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map((item: any) => item.show);
  } catch {
    return [];
  }
}

export function filterSavedShowsByMoodAndGenre(
  shows: SpotifyShow[],
  mood: Mood,
  genres: string[]
): SpotifyShow[] {
  const moodKeywords = moodToQuery[mood].toLowerCase().split(' ');
  const genreKeywords = genres.map((g) => g.toLowerCase());

  return shows.filter((show) => {
    const text = `${show.name} ${show.description}`.toLowerCase();
    const matchesMood = moodKeywords.some((kw) => text.includes(kw));
    const matchesGenre = genreKeywords.length === 0 || genreKeywords.some((kw) => text.includes(kw));
    return matchesMood || matchesGenre;
  });
}

export async function getUserSavedShowIds(accessToken: string): Promise<Set<string>> {
  try {
    const res = await fetch(`${SPOTIFY_API}/me/shows?limit=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.log('❌ Saved shows fetch failed:', res.status, await res.text());
      return new Set();
    }
    const data = await res.json();
    const ids = new Set<string>((data.items ?? []).map((item: any) => item.show.id as string));
    console.log(`✅ Found ${ids.size} saved shows in Spotify library:`, [...ids]);
    return ids;
  } catch (e) {
    console.log('❌ getUserSavedShowIds error:', e);
    return new Set();
  }
}

/**
 * Builds a map of showId → library/playlist name.
 * Shows saved via /me/shows default to "Podcasts".
 * Shows whose episodes appear in a named playlist use that playlist name.
 */
export async function getUserShowLibraryMap(
  accessToken: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  // 1. All saved shows → default label "Podcasts"
  try {
    const res = await fetch(`${SPOTIFY_API}/me/shows?limit=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      (data.items ?? []).forEach((item: any) => {
        if (item.show?.id) result[item.show.id] = 'Podcasts';
      });
    }
  } catch {}

  // 2. Check user's playlists for podcast episodes → override with playlist name
  try {
    const res = await fetch(`${SPOTIFY_API}/me/playlists?limit=20`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return result;
    const data = await res.json();
    const playlists: any[] = data.items ?? [];

    await Promise.all(
      playlists.map(async (pl) => {
        try {
          const tracksRes = await fetch(
            `${SPOTIFY_API}/playlists/${pl.id}/tracks?limit=100&fields=items(track(type,show(id)))`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!tracksRes.ok) return;
          const tracksData = await tracksRes.json();
          (tracksData.items ?? []).forEach((item: any) => {
            const showId = item?.track?.show?.id;
            if (showId) result[showId] = pl.name;
          });
        } catch {}
      })
    );
  } catch {}

  return result;
}

export async function getSpotifyShowEpisodes(
  accessToken: string,
  showId: string,
  durationMs: number
): Promise<any[]> {
  const res = await fetch(
    `${SPOTIFY_API}/shows/${showId}/episodes?market=US&limit=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  // Filter episodes close to the desired duration (±10 min)
  return (data.items ?? []).filter((ep: any) => {
    const diff = Math.abs(ep.duration_ms - durationMs);
    return diff <= 10 * 60 * 1000;
  });
}
