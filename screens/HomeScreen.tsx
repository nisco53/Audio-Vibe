import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DurationPicker } from '../components/DurationPicker';
import { GenreSelector } from '../components/GenreSelector';
import { MoodSelector } from '../components/MoodSelector';
import { searchAudiobooks } from '../lib/googlebooks';
import { supabase } from '../lib/supabase';
import { filterSavedShowsByMoodAndGenre, getUserSavedShowIds, getUserSavedShows, getUserShowLibraryMap, searchSpotifyPodcasts } from '../lib/spotify';
import { getSpotifyToken } from '../lib/tokens';
import { Content, FilterState, Genre, Mood } from '../lib/types';

interface Props {
  onResults: (results: Content[], filters: FilterState) => void;
  onOpenAccounts: () => void;
}

export function HomeScreen({ onResults, onOpenAccounts }: Props) {
  const [duration, setDuration] = useState<number>(30);
  const [mood, setMood] = useState<Mood | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [searchMyLibrary, setSearchMyLibrary] = useState(false);

  useEffect(() => {
    getSpotifyToken().then((token) => setSpotifyConnected(!!token));
  }, []);

  const toggleGenre = (genre: Genre) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleFind = async () => {
    if (!mood) {
      Alert.alert('Pick a mood', "Let us know how you're feeling for the trip!");
      return;
    }

    setLoading(true);
    try {
      const token = await getSpotifyToken();
      let results: Content[] = [];

      if (token && searchMyLibrary) {
        // --- My Library mode: filter from saved shows only ---
        const [savedShows, savedShowIds, libraryMap] = await Promise.all([
          getUserSavedShows(token),
          getUserSavedShowIds(token),
          getUserShowLibraryMap(token),
        ]);

        const filtered = filterSavedShowsByMoodAndGenre(savedShows, mood, genres);
        const podcastResults: Content[] = filtered.map((show) => ({
          id: show.id,
          title: show.name,
          author: show.publisher,
          type: 'podcast' as const,
          genres: genres.length > 0 ? genres : ['Society & Culture'],
          mood_tags: [mood!],
          min_duration: 15,
          max_duration: 120,
          description: show.description?.slice(0, 200) ?? '',
          cover_color: '#1DB954',
          rating: 4.5,
          episode_count: show.total_episodes,
          created_at: new Date().toISOString(),
          spotify_id: show.id,
          spotify_url: show.external_urls?.spotify,
        }));

        onResults(podcastResults, { duration, mood, genres, savedSpotifyIds: [...savedShowIds], spotifyLibraryMap: libraryMap });
        return;
      }

      if (token) {
        // --- Live mode: Spotify + Google Books ---
        const [spotifyShows, books, savedShowIds, libraryMap] = await Promise.all([
          searchSpotifyPodcasts(token, mood, genres),
          searchAudiobooks(mood, genres),
          getUserSavedShowIds(token),
          getUserShowLibraryMap(token),
        ]);

        const podcastResults: Content[] = spotifyShows.map((show) => ({
          id: show.id,
          title: show.name,
          author: show.publisher,
          type: 'podcast' as const,
          genres: genres.length > 0 ? genres : ['Society & Culture'],
          mood_tags: [mood!],
          min_duration: 15,
          max_duration: 120,
          description: show.description?.slice(0, 200) ?? '',
          cover_color: savedShowIds.has(show.id) ? '#1DB954' : '#6C63FF',
          rating: 4.5,
          episode_count: show.total_episodes,
          created_at: new Date().toISOString(),
          spotify_id: show.id,
          spotify_url: show.external_urls?.spotify,
        }));

        const bookResults: Content[] = books
          .filter((b) => b.volumeInfo?.title)
          .map((b) => ({
            id: b.id,
            title: b.volumeInfo.title,
            author: b.volumeInfo.authors?.[0] ?? 'Unknown',
            type: 'audiobook' as const,
            genres: genres.length > 0 ? genres : ['Self-Help'],
            mood_tags: [mood!],
            min_duration: 30,
            max_duration: 180,
            description: b.volumeInfo.description?.slice(0, 200) ?? '',
            cover_color: '#4285F4',
            rating: b.volumeInfo.averageRating ?? 4.0,
            created_at: new Date().toISOString(),
          }));

        results = [...podcastResults, ...bookResults];
        onResults(results, { duration, mood, genres, savedSpotifyIds: [...savedShowIds], spotifyLibraryMap: libraryMap });
        return;
      } else {
        // --- Supabase curated library mode ---
        let query = supabase
          .from('content')
          .select('*')
          .lte('min_duration', duration)
          .gte('max_duration', duration)
          .contains('mood_tags', [mood]);

        if (genres.length > 0) {
          query = query.overlaps('genres', genres);
        }

        const { data, error } = await query.order('rating', { ascending: false }).limit(20);
        if (error) throw error;
        results = (data ?? []) as Content[];
      }

      onResults(results, { duration, mood, genres });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not fetch recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={onOpenAccounts} style={styles.accountsBtn}>
                <Text style={styles.accountsIcon}>⚙️</Text>
                {spotifyConnected && <View style={styles.connectedDot} />}
              </TouchableOpacity>
            </View>
            <Text style={styles.logo}>🎧</Text>
            <Text style={styles.title}>AudioVibe</Text>
            <Text style={styles.subtitle}>The perfect listen for your commute</Text>
            {spotifyConnected && (
              <View style={styles.liveChip}>
                <Text style={styles.liveChipText}>🟢 Live from Spotify + Google Books</Text>
              </View>
            )}
          </View>

          <DurationPicker selected={duration} onSelect={setDuration} />
          <MoodSelector selected={mood} onSelect={setMood} />
          <GenreSelector selected={genres} onToggle={toggleGenre} />

          {spotifyConnected && (
            <TouchableOpacity
              style={[styles.libraryToggle, searchMyLibrary && styles.libraryToggleActive]}
              onPress={() => setSearchMyLibrary((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.libraryToggleIcon}>{searchMyLibrary ? '✓' : '🎵'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.libraryToggleTitle, searchMyLibrary && styles.libraryToggleTitleActive]}>
                  Search from My Library
                </Text>
                <Text style={styles.libraryToggleSub}>
                  {searchMyLibrary ? 'Only shows you follow on Spotify' : 'Tap to search your saved Spotify shows'}
                </Text>
              </View>
              <View style={[styles.libraryToggleSwitch, searchMyLibrary && styles.libraryToggleSwitchActive]}>
                <View style={[styles.libraryToggleKnob, searchMyLibrary && styles.libraryToggleKnobActive]} />
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={handleFind}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.ctaText}>Find My Vibe →</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12122A' },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 16, paddingBottom: 36 },
  headerTop: { flexDirection: 'row', width: '100%', justifyContent: 'flex-end', marginBottom: 8 },
  accountsBtn: { padding: 8, position: 'relative' },
  accountsIcon: { fontSize: 22 },
  connectedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DB954',
  },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { color: '#7777AA', fontSize: 14, marginTop: 4 },
  liveChip: {
    marginTop: 10,
    backgroundColor: '#1A3A2A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveChipText: { color: '#4ADE80', fontSize: 12, fontWeight: '600' },
  cta: {
    backgroundColor: '#6C63FF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  libraryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A35',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A50',
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  libraryToggleActive: {
    borderColor: '#1DB954',
    backgroundColor: '#0D2B1A',
  },
  libraryToggleIcon: { fontSize: 20 },
  libraryToggleTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  libraryToggleTitleActive: { color: '#1DB954' },
  libraryToggleSub: { color: '#7777AA', fontSize: 11, marginTop: 2 },
  libraryToggleSwitch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2A2A50',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  libraryToggleSwitchActive: { backgroundColor: '#1DB954' },
  libraryToggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  libraryToggleKnobActive: { alignSelf: 'flex-end' },
});
