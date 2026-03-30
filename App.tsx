import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { AccountsScreen } from './screens/AccountsScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { Content, FilterState } from './lib/types';

type Screen = 'home' | 'results' | 'accounts';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [results, setResults] = useState<Content[]>([]);
  const [filters, setFilters] = useState<FilterState>({ duration: 30, mood: null, genres: [] });

  const handleResults = (data: Content[], f: FilterState) => {
    setResults(data);
    setFilters(f);
    setScreen('results');
  };

  return (
    <>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen onResults={handleResults} onOpenAccounts={() => setScreen('accounts')} />
      )}
      {screen === 'results' && (
        <ResultsScreen results={results} filters={filters} onBack={() => setScreen('home')} />
      )}
      {screen === 'accounts' && (
        <AccountsScreen onBack={() => setScreen('home')} />
      )}
    </>
  );
}
