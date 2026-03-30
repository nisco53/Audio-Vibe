import { supabase } from './supabase';
import { Mood } from './types';

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: { thumbnail: string };
    averageRating?: number;
    categories?: string[];
  };
}

export async function searchAudiobooks(
  mood: Mood,
  genres: string[]
): Promise<GoogleBook[]> {
  // Calls our Edge Function — Google Books key never leaves the server
  const { data, error } = await supabase.functions.invoke('books-search', {
    body: { mood, genres },
  });

  if (error) throw new Error(error.message);
  return data ?? [];
}
