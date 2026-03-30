import { Genre } from '../lib/types';

export const GENRES: { value: Genre; emoji: string }[] = [
  { value: 'True Crime',        emoji: '🔪' },
  { value: 'Comedy',            emoji: '😂' },
  { value: 'Self-Help',         emoji: '💡' },
  { value: 'Technology',        emoji: '💻' },
  { value: 'Business',          emoji: '📈' },
  { value: 'Science',           emoji: '🔬' },
  { value: 'History',           emoji: '📜' },
  { value: 'Fiction',           emoji: '📖' },
  { value: 'Health & Fitness',  emoji: '💪' },
  { value: 'Society & Culture', emoji: '🌍' },
  { value: 'News',              emoji: '📰' },
  { value: 'Sports',            emoji: '⚽' },
  { value: 'Arts',              emoji: '🎨' },
];

export const DURATION_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
  { label: '2 hrs+', value: 120 },
];
