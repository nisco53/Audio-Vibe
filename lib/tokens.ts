import AsyncStorage from '@react-native-async-storage/async-storage';

const SPOTIFY_TOKEN_KEY = 'spotify_access_token';
const SPOTIFY_EXPIRY_KEY = 'spotify_token_expiry';

export async function saveSpotifyToken(token: string, expiresIn: number) {
  const expiry = Date.now() + expiresIn * 1000;
  await AsyncStorage.multiSet([
    [SPOTIFY_TOKEN_KEY, token],
    [SPOTIFY_EXPIRY_KEY, expiry.toString()],
  ]);
}

export async function getSpotifyToken(): Promise<string | null> {
  const [[, token], [, expiry]] = await AsyncStorage.multiGet([
    SPOTIFY_TOKEN_KEY,
    SPOTIFY_EXPIRY_KEY,
  ]);
  if (!token || !expiry) return null;
  if (Date.now() > parseInt(expiry)) return null; // expired
  return token;
}

export async function clearSpotifyToken() {
  await AsyncStorage.multiRemove([SPOTIFY_TOKEN_KEY, SPOTIFY_EXPIRY_KEY]);
}
