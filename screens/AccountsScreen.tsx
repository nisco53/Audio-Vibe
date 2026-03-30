'use client';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { clearSpotifyToken, getSpotifyToken, saveSpotifyToken } from '../lib/tokens';

WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

// Generates the correct URI for both Expo Go and production
const redirectUri = AuthSession.makeRedirectUri({ scheme: 'audio-vibe' });
console.log('🔗 Redirect URI (register this in Spotify):', redirectUri);

interface Props {
  onBack: () => void;
}

interface SpotifyProfile {
  display_name: string;
  email: string;
  followers: { total: number };
  images: { url: string }[];
}

export function AccountsScreen({ onBack }: Props) {
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyProfile, setSpotifyProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: ['user-read-private', 'user-read-email', 'user-library-read'],
      usePKCE: true,
      redirectUri,
    },
    discovery
  );

  const fetchSpotifyProfile = async (token: string) => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSpotifyProfile(data);
    } catch (_) {}
  };

  // Check if already connected on mount
  useEffect(() => {
    getSpotifyToken().then((token) => {
      if (token) {
        setSpotifyConnected(true);
        fetchSpotifyProfile(token);
      }
    });
  }, []);

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code);
    } else if (response?.type === 'error') {
      Alert.alert('Spotify Error', response.error?.message ?? 'Authentication failed');
    }
  }, [response]);

  const exchangeCodeForToken = async (code: string) => {
    setLoading(true);
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: request!.codeVerifier!,
      });

      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const data = await res.json();
      if (data.access_token) {
        await saveSpotifyToken(data.access_token, data.expires_in);
        setSpotifyConnected(true);
        await fetchSpotifyProfile(data.access_token);
        Alert.alert('Spotify Connected!', 'Your recommendations will now include live Spotify podcasts.');
      } else {
        throw new Error(data.error_description ?? 'Token exchange failed');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectSpotify = async () => {
    Alert.alert('Disconnect Spotify', 'Remove your Spotify connection?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await clearSpotifyToken();
          setSpotifyConnected(false);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Connected Accounts</Text>
      </View>

      <View style={styles.content}>
        {/* Dev helper — shows redirect URI to register in Spotify */}
        <View style={styles.devBox}>
          <Text style={styles.devLabel}>Register this in Spotify Dashboard:</Text>
          <Text selectable style={styles.devUri}>{redirectUri}</Text>
        </View>

        {/* Spotify Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <Text style={styles.serviceIcon}>🎵</Text>
              <View>
                <Text style={styles.serviceName}>Spotify</Text>
                <Text style={styles.serviceDesc}>Live podcast recommendations</Text>
              </View>
            </View>
            <View style={[styles.badge, spotifyConnected ? styles.badgeConnected : styles.badgeDisconnected]}>
              <Text style={styles.badgeText}>{spotifyConnected ? 'Connected' : 'Not connected'}</Text>
            </View>
          </View>

          {spotifyConnected && spotifyProfile && (
            <View style={styles.profileBox}>
              <Text style={styles.profileName}>✅ {spotifyProfile.display_name}</Text>
              <Text style={styles.profileEmail}>{spotifyProfile.email}</Text>
              <Text style={styles.profileFollowers}>
                {spotifyProfile.followers?.total?.toLocaleString()} followers
              </Text>
            </View>
          )}

          {spotifyConnected ? (
            <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnectSpotify}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.connectBtn, styles.spotifyBtn, (!request || loading) && styles.btnDisabled]}
              onPress={() => promptAsync()}
              disabled={!request || loading}
            >
              <Text style={styles.connectText}>
                {loading ? 'Connecting...' : 'Connect Spotify'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Google Books Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <Text style={styles.serviceIcon}>📚</Text>
              <View>
                <Text style={styles.serviceName}>Google Books</Text>
                <Text style={styles.serviceDesc}>Live audiobook recommendations</Text>
              </View>
            </View>
            <View style={[styles.badge, styles.badgeConnected]}>
              <Text style={styles.badgeText}>Always on</Text>
            </View>
          </View>
          <Text style={styles.infoText}>
            Google Books is active by default — no login needed. Audiobook results are pulled live whenever you search.
          </Text>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>How it works</Text>
          <Text style={styles.infoBoxText}>
            When Spotify is connected, your podcast results come directly from Spotify's catalogue based on your mood and genre. Audiobooks always pull from Google Books in real time.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12122A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E3A',
  },
  backBtn: { marginRight: 16 },
  backText: { color: '#6C63FF', fontSize: 16 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  content: { padding: 20 },
  card: {
    backgroundColor: '#1A1A35',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A50',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceIcon: { fontSize: 32 },
  serviceName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  serviceDesc: { color: '#7777AA', fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeConnected: { backgroundColor: '#1A3A2A' },
  badgeDisconnected: { backgroundColor: '#2A2A2A' },
  badgeText: { color: '#4ADE80', fontSize: 11, fontWeight: '600' },
  connectBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  spotifyBtn: { backgroundColor: '#1DB954' },
  btnDisabled: { opacity: 0.5 },
  connectText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  disconnectBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  disconnectText: { color: '#FF4444', fontWeight: '600', fontSize: 14 },
  infoText: { color: '#7777AA', fontSize: 13, lineHeight: 20 },
  infoBox: {
    backgroundColor: '#1E1E3A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#6C63FF',
  },
  infoBoxTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  infoBoxText: { color: '#7777AA', fontSize: 13, lineHeight: 20 },
  devBox: { backgroundColor: '#2A1A00', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FF9800' },
  devLabel: { color: '#FF9800', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  devUri: { color: '#FFE0B2', fontSize: 12, fontFamily: 'monospace' },
  profileBox: { backgroundColor: '#0D2B1A', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1DB954' },
  profileName: { color: '#1DB954', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  profileEmail: { color: '#7777AA', fontSize: 12, marginBottom: 2 },
  profileFollowers: { color: '#7777AA', fontSize: 12 },
});
