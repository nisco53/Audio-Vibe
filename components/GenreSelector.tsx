import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GENRES } from '../constants/genres';
import { Genre } from '../lib/types';

interface Props {
  selected: Genre[];
  onToggle: (genre: Genre) => void;
}

export function GenreSelector({ selected, onToggle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>🎙  Genres & Interests</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {GENRES.map((g) => {
          const isActive = selected.includes(g.value);
          return (
            <TouchableOpacity
              key={g.value}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onToggle(g.value)}
              activeOpacity={0.75}
            >
              <Text style={styles.emoji}>{g.emoji}</Text>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {g.value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 32 },
  label: { color: '#E0E0E0', fontSize: 15, fontWeight: '600', marginBottom: 12, letterSpacing: 0.3 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#3A3A5C',
    backgroundColor: '#1E1E35',
  },
  chipActive: {
    backgroundColor: '#FF6B3533',
    borderColor: '#FF6B35',
  },
  emoji: { fontSize: 14 },
  chipText: { color: '#9999BB', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FF6B35' },
});
