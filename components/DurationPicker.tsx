"use client";
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DURATION_OPTIONS } from '../constants/genres';

interface Props {
  selected: number;
  onSelect: (value: number) => void;
}

export function DurationPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>🚗  Trip Duration</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {DURATION_OPTIONS.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 28 },
  label: { color: '#E0E0E0', fontSize: 15, fontWeight: '600', marginBottom: 12, letterSpacing: 0.3 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#3A3A5C',
    backgroundColor: '#1E1E35',
  },
  pillActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  pillText: { color: '#9999BB', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF' },
});
