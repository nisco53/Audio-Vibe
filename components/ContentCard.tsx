import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Content } from '../lib/types';

interface Props {
  item: Content;
  index: number;
  inLibrary?: boolean | string;
}

const TYPE_COLORS: Record<string, string> = {
  podcast: '#6C63FF',
  audiobook: '#FF6B35',
};

export function ContentCard({ item, inLibrary }: Props) {
  const typeColor = TYPE_COLORS[item.type] ?? '#6C63FF';
  const stars = '★'.repeat(Math.round(item.rating)) + '☆'.repeat(5 - Math.round(item.rating));

  const handleOpenSpotify = () => {
    if (!item.spotify_url) return;
    // Try deep link into Spotify app first, fallback to browser
    const appUrl = `spotify:show:${item.spotify_id}`;
    Linking.canOpenURL(appUrl).then((supported) => {
      Linking.openURL(supported ? appUrl : item.spotify_url!);
    });
  };

  return (
    <View style={[styles.card, { borderLeftColor: item.cover_color }]}>
      {/* Color swatch */}
      <View style={[styles.swatch, { backgroundColor: item.cover_color }]}>
        <Text style={styles.swatchEmoji}>{item.type === 'podcast' ? '🎙' : '📚'}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '33', borderColor: typeColor }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {item.type.toUpperCase()}
            </Text>
          </View>
          <View style={styles.topRight}>
            {inLibrary && (
              <View style={styles.libraryBadge}>
                <Text style={styles.libraryText}>
                  ✓ In Your Library{typeof inLibrary === 'string' ? `: ${inLibrary}` : ''}
                </Text>
              </View>
            )}
            <Text style={styles.rating}>{stars}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.author}>{item.author}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        <View style={styles.footer}>
          <View style={styles.meta}>
            <Text style={styles.metaText}>⏱ {item.min_duration}–{item.max_duration} min</Text>
            {item.episode_count && (
              <Text style={styles.metaText}>  {item.episode_count} eps</Text>
            )}
          </View>

          {item.spotify_url && (
            <TouchableOpacity style={styles.spotifyBtn} onPress={handleOpenSpotify}>
              <Text style={styles.spotifyBtnText}>▶ Open in Spotify</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E35',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderLeftWidth: 4,
  },
  swatch: { width: 72, alignItems: 'center', justifyContent: 'center' },
  swatchEmoji: { fontSize: 28 },
  info: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  typeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  libraryBadge: { backgroundColor: '#0D2B1A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#1DB954' },
  libraryText: { color: '#1DB954', fontSize: 10, fontWeight: '700' },
  rating: { fontSize: 11, color: '#FFE66D' },
  title: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  author: { color: '#9999BB', fontSize: 12, marginBottom: 6 },
  description: { color: '#7777AA', fontSize: 12, lineHeight: 17, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { flexDirection: 'row' },
  metaText: { color: '#6C63FF', fontSize: 11, fontWeight: '600' },
  spotifyBtn: { backgroundColor: '#1DB954', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  spotifyBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
