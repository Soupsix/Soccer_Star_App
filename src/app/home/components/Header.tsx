import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '@/services/firebase';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function Header() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const user = auth.currentUser;
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View>
        <ThemedText style={styles.greetingText}>Xin chào, Champ! 👋</ThemedText>
        <ThemedText type="subtitle" style={styles.usernameText}>
          {user?.displayName || 'Thành viên mới'}
        </ThemedText>
      </View>
      <View style={styles.rightActions}>
        {/* Search Icon */}
        <TouchableOpacity
          style={[styles.notiBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/search' as any)}
        >
          <Ionicons name="search-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        {/* Notification Icon */}
        <TouchableOpacity 
          style={[styles.notiBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
          <View style={styles.badgeDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  walletText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  notiBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4F',
  },
});
