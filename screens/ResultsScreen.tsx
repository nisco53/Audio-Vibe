import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ContentCard } from '../components/ContentCard';
import { Content, FilterState } from '../lib/types';

interface Props {
  results: Content[];
  filters: FilterState;
  onBack: () => void;
}

export function ResultsScreen({ results, filters, onBack }: Props) {
  const [libraryOnly, setLibraryOnly] = useState(false);

  const savedIds = filters.savedSpotifyIds ?? [];
  const libraryMap = filters.spotifyLibraryMap ?? {};
  const hasLibraryItems = results.some((r) => r.spotify_id && savedIds.includes(r.spotify_id));

  const displayResults = libraryOnly
    ? results.filter((r) => r.spotify_id && savedIds.includes(r.spotify_id))
    : results;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Your Vibe</Text>
          <Text style={styles.subtitle}>
            {filters.duration} min · {filters.mood ?? 'any mood'}
            {filters.genres.length > 0 ? ` · ${filters.genres.join(' · ')}` : ''}
          </Text>
        </View>
      </View>

      {/* Library filter toggle — only shown when Spotify is connected */}
      {savedIds.length > 0 && (
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[styles.filterChip, libraryOnly && styles.filterChipActive]}
            onPress={() => setLibraryOnly(!libraryOnly)}
          >
            <Text style={[styles.filterChipText, libraryOnly && styles.filterChipTextActive]}>
              {libraryOnly ? '✓ My Library Only' : '🎵 My Library Only'}
            </Text>
          </TouchableOpacity>
          {libraryOnly && !hasLibraryItems && (
            <Text style={styles.filterNote}>None of these are in your Spotify library</Text>
          )}
        </View>
      )}

      {displayResults.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎙</Text>
          <Text style={styles.emptyTitle}>
            {libraryOnly ? 'None in your library' : 'No matches found'}
          </Text>
          <Text style={styles.emptyText}>
            {libraryOnly
              ? 'None of these results are saved in your Spotify library. Turn off the filter to see all results.'
              : 'Try a different mood or fewer genre filters.'}
          </Text>
          {libraryOnly && (
            <TouchableOpacity style={styles.clearFilter} onPress={() => setLibraryOnly(false)}>
              <Text style={styles.clearFilterText}>Show All Results</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ContentCard
              item={item}
              index={index}
              inLibrary={
                item.spotify_id && savedIds.includes(item.spotify_id)
                  ? (libraryMap[item.spotify_id] ?? 'Spotify')
                  : false
              }
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>
              {displayResults.length} recommendation{displayResults.length !== 1 ? 's' : ''}
              {libraryOnly ? ' from your library' : ''}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12122A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A4A',
  },
  backBtn: { paddingRight: 16, paddingVertical: 4 },
  backText: { color: '#6C63FF', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#7777AA', fontSize: 12, marginTop: 2 },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E3A',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1DB954',
    backgroundColor: 'transparent',
  },
  filterChipActive: { backgroundColor: '#1DB954' },
  filterChipText: { color: '#1DB954', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  filterNote: { color: '#7777AA', fontSize: 12 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  count: { color: '#5555AA', fontSize: 12, fontWeight: '600', marginBottom: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#7777AA', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  clearFilter: {
    marginTop: 20,
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFilterText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
