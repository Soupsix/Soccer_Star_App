import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeService } from './services/home.service';
import { HomeMatch, HomePlayer, AIRecommendation } from './types/home.types';
import Header from './components/Header';
import HotMatchesSection from './components/HotMatchesSection';
import TodayMatchesSection from './components/TodayMatchesSection';
import UpcomingMatchesSection from './components/UpcomingMatchesSection';
import FavoritePlayersSection from './components/FavoritePlayersSection';
import AIRecommendationCard from './components/AIRecommendationCard';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Feature data states
  const [hotMatches, setHotMatches] = useState<HomeMatch[]>([]);
  const [todayMatches, setTodayMatches] = useState<HomeMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<HomeMatch[]>([]);
  const [favoritePlayers, setFavoritePlayers] = useState<HomePlayer[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);

  // Fetch all Home screen data
  const fetchData = async () => {
    try {
      const [hot, today, upcoming, players, ai] = await Promise.all([
        HomeService.getHotMatches(),
        HomeService.getTodayMatches(),
        HomeService.getUpcomingMatches(),
        HomeService.getFavoritePlayers(),
        HomeService.getAIRecommendation(),
      ]);
      setHotMatches(hot);
      setTodayMatches(today);
      setUpcomingMatches(upcoming);
      setFavoritePlayers(players);
      setAiRecommendation(ai);
    } catch (err) {
      console.error('Error fetching Home page data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* 1. Header (Greeting, User profile, Coin balance) */}
          <View style={styles.innerPadding}>
            <Header />
          </View>

          {/* 6. AI Recommendation Card */}
          <AIRecommendationCard recommendation={aiRecommendation} />

          {/* 2. Hot Matches Section */}
          <HotMatchesSection matches={hotMatches} />

          {/* 3. Today's Matches Section */}
          <TodayMatchesSection matches={todayMatches} />

          {/* 4. Upcoming Matches Section */}
          <UpcomingMatchesSection matches={upcomingMatches} />

          {/* 5. Favorite Players Section */}
          <FavoritePlayersSection players={favoritePlayers} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  innerPadding: {
    paddingHorizontal: 24,
  },
});
