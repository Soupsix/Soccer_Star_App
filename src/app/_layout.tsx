import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, type User } from 'firebase/auth';
import 'react-native-reanimated';

import { auth } from '@/services/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUserLiveSync } from '@/hooks/use-user-live-sync';
import { Colors } from '@/constants/theme';
import '@/widgets/register-widget-task-handler';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  useUserLiveSync();
  const router = useRouter();
  const segments = useSegments();
  
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === 'auth';

    const redirectTimer = setTimeout(() => {
      if (!user && !inAuthGroup) {
        // Redirect to login if not authenticated
        router.replace('/auth/login');
      } else if (user && inAuthGroup) {
        // Redirect to main tabs if authenticated
        router.replace('/(tabs)');
      }
    }, 0);

    return () => clearTimeout(redirectTimer);
  }, [user, segments, initializing, router]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[colorScheme].background }}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="search" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="tournament/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="team/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="match/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="news/article" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen
          name="profile/personal-info"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
