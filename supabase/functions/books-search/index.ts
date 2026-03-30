import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const moodToQuery: Record<string, string> = {
  focused: 'productivity focus',
  energized: 'motivation success',
  relaxed: 'relaxing fiction',
  curious: 'science discovery',
  motivated: 'self improvement',
  reflective: 'memoir philosophy',
  happy: 'humor comedy',
  calm: 'mindfulness wellness',
  tired: 'short stories easy',
  drained: 'healing wellness',
  anxious: 'anxiety calm mindfulness',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mood, genres } = await req.json();

    if (!mood) {
      return new Response(
        JSON.stringify({ error: 'mood is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Key lives securely on the server — never in the app bundle
    const apiKey = Deno.env.get('GOOGLE_BOOKS_KEY');

    const moodQuery = moodToQuery[mood] ?? mood;
    const genreQuery = Array.isArray(genres) && genres.length > 0 ? genres[0] : '';
    const query = `${moodQuery} ${genreQuery} audiobook`.trim();

    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&printType=books&maxResults=10${keyParam}`;

    const response = await fetch(url);
    const data = await response.json();

    return new Response(
      JSON.stringify(data.items ?? []),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
