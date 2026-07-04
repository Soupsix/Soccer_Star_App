import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

import { auth } from '@/services/firebase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const user = auth.currentUser;

  const performLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
      if (confirm) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng xuất',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* User Info Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <IconSymbol size={40} name="person.fill" color={colors.primary} />
          </View>
          <ThemedText type="subtitle" style={styles.username}>
            {user?.displayName || 'Thành viên Football Star'}
          </ThemedText>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
        </View>

        {/* Menu Items */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => {}}>
            <IconSymbol size={22} name="person.fill" color={colors.text} />
            <ThemedText style={styles.menuText}>Thông tin cá nhân</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => {}}>
            <IconSymbol size={22} name="house.fill" color={colors.text} />
            <ThemedText style={styles.menuText}>Ví Coin & Lịch sử</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => {}}>
            <IconSymbol size={22} name="house.fill" color={colors.text} />
            <ThemedText style={styles.menuText}>Cài đặt thông báo</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: '#FF4D4F' }]}
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutText}>ĐĂNG XUẤT</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 15,
    marginLeft: 16,
    fontWeight: '500',
  },
  logoutBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF4D4F',
    fontWeight: '700',
    fontSize: 15,
  },
});
