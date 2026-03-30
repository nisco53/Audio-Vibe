import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MOODS } from '../constants/moods';
import { Mood } from '../lib/types';

interface Props {
  selected: Mood | null;
  onSelect: (mood: Mood) => void;
}

export function MoodSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>✨  How are you feeling?</Text>
      <View style={styles.grid}>
        {MOODS.map((mood) => {
          const isActive = selected === mood.value;
          return (
            <TouchableOpacity
              key={mood.value}
              style={[
                styles.chip,
                isActive && { backgroundColor: mood.color + '33', borderColor: mood.color },
              ]}
              onPress={() => onSelect(mood.value)}
              activeOpacity={0.75}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
              <Text style={[styles.chipText, isActive && { color: mood.color }]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 28 },
  label: { color: '#E0E0E0', fontSize: 15, fontWeight: '600', marginBottom: 12, letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
  emoji: { fontSize: 14 },
  chipText: { color: '#9999BB', fontSize: 13, fontWeight: '600' },
});
