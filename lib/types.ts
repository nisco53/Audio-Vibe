export type ContentType = 'podcast' | 'audiobook';

export type Mood =
  | 'focused'
  | 'energized'
  | 'relaxed'
  | 'curious'
  | 'motivated'
  | 'reflective'
  | 'happy'
  | 'calm'
  | 'tired'
  | 'drained'
  | 'anxious';

export type Genre =
  | 'True Crime'
  | 'Comedy'
  | 'Self-Help'
  | 'Technology'
  | 'Business'
  | 'Science'
  | 'History'
  | 'Fiction'
  | 'Health & Fitness'
  | 'Society & Culture'
  | 'News'
  | 'Sports'
  | 'Arts';

export interface Content {
  id: string;
  title: string;
  author: string;
  type: ContentType;
  genres: Genre[];
  mood_tags: Mood[];
  min_duration: number;
  max_duration: number;
  description: string;
  cover_color: string;
  rating: number;
  episode_count?: number;
  created_at: string;
  spotify_id?: string;
  spotify_url?: string;
}

export interface FilterState {
  duration: number;
  mood: Mood | null;
  genres: Genre[];
  savedSpotifyIds?: string[];
  spotifyLibraryMap?: Record<string, string>; // showId → playlist/library name
}
