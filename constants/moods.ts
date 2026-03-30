import { Mood } from '../lib/types';

export const MOODS: { value: Mood; label: string; emoji: string; color: string }[] = [
  { value: 'focused',    label: 'Focused',    emoji: '🎯', color: '#6C63FF' },
  { value: 'energized',  label: 'Energized',  emoji: '⚡', color: '#FF6B35' },
  { value: 'relaxed',    label: 'Relaxed',    emoji: '🌊', color: '#4ECDC4' },
  { value: 'curious',    label: 'Curious',    emoji: '🔍', color: '#FFE66D' },
  { value: 'motivated',  label: 'Motivated',  emoji: '🚀', color: '#FF6B9D' },
  { value: 'reflective', label: 'Reflective', emoji: '🌙', color: '#A8DADC' },
  { value: 'happy',      label: 'Happy',      emoji: '😊', color: '#F7DC6F' },
  { value: 'calm',       label: 'Calm',       emoji: '🍃', color: '#82C596' },
  { value: 'tired',      label: 'Tired',      emoji: '😴', color: '#7986CB' },
  { value: 'drained',    label: 'Drained',    emoji: '🪫',  color: '#90A4AE' },
  { value: 'anxious',    label: 'Anxious',    emoji: '😰', color: '#80CBC4' },
];
