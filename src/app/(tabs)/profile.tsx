import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useCallback } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useFavorites } from '@/hooks/use-favorites';
import { auth } from '@/services/firebase';

// Player data for rendering favourite cards
import playersData from '@/assets/data/players.json';

interface Player {
  idPlayer: string;
  name: string;
  team: string;
  nationality: string;
  thumb: string;
  cutout: string;
  position: string;
}

const CONTENT_MAX_WIDTH = 640;

export default function ProfileScreen() {
  const router      = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors      = Colors[colorScheme];
  const { width }   = useWindowDimensions();
  const isWide      = width >= 600;
  const hPad        = isWide ? 32 : 24;

  // ── Reactive auth user: re-renders when refreshUser() is called or auth state changes
  const { user, refreshUser } = useAuthUser();

  // ── When this tab gains focus, reload the user to pick up any
  //    profile changes made in personal-info screen
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  // ── Reactive favorites via onSnapshot ──────────────────────────────────────
  const { favorites, toggleFavorite } = useFavorites();

  const favPlayers = (playersData as Player[]).filter((p) =>
    favorites.includes(p.idPlayer),
  );

  // ── Auth ───────────────────────────────────────────────────────────────────
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
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) performLogout();
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: hPad, paddingTop: isWide ? 60 : 80 },
        ]}
      >
        <View style={[styles.inner, { maxWidth: CONTENT_MAX_WIDTH }]}>

          {/* ── Avatar + name ── */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatarRing, { borderColor: colors.primary + '50' }]}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                  <IconSymbol size={40} name="person.fill" color={colors.primary} />
                </View>
              )}
            </View>
            <ThemedText type="subtitle" style={[styles.username, { fontSize: isWide ? 24 : 20 }]}>
              {user?.displayName || 'Thành viên Football Star'}
            </ThemedText>
            <ThemedText style={styles.email}>{user?.email}</ThemedText>
          </View>

          {/* ── Menu ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push('/profile/personal-info')}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: colors.primary + '18' }]}>
                <IconSymbol size={18} name="person.fill" color={colors.primary} />
              </View>
              <ThemedText style={styles.menuText}>Thông tin cá nhân</ThemedText>
              <IconSymbol size={16} name="chevron.right" color="#A0AEC0" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {}}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: colors.primary + '18' }]}>
                <IconSymbol size={18} name="dollarsign.circle.fill" color={colors.primary} />
              </View>
              <ThemedText style={styles.menuText}>Ví Coin & Lịch sử</ThemedText>
              <IconSymbol size={16} name="chevron.right" color="#A0AEC0" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: 'transparent' }]}
              onPress={() => router.push('/profile/personal-info?tab=notifications')}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: colors.primary + '18' }]}>
                <IconSymbol size={18} name="bell.fill" color={colors.primary} />
              </View>
              <ThemedText style={styles.menuText}>Cài đặt thông báo</ThemedText>
              <IconSymbol size={16} name="chevron.right" color="#A0AEC0" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>

          {/* ── Favourite Players ── */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>❤️</Text>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Cầu thủ yêu thích
              </ThemedText>
            </View>
            <ThemedText style={styles.sectionCount}>
              {favPlayers.length} cầu thủ
            </ThemedText>
          </View>

          {favPlayers.length === 0 ? (
            <View style={[styles.emptyFav, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.emptyFavEmoji}>💔</Text>
              <ThemedText style={styles.emptyFavText}>
                Bạn chưa yêu thích cầu thủ nào.
              </ThemedText>
              <ThemedText style={{ color: '#A0AEC0', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                Vào trang Cầu thủ và nhấn ❤️ để thêm.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={favPlayers}
              keyExtractor={(item) => item.idPlayer}
              horizontal={false}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <FavPlayerRow
                  player={item}
                  colors={colors}
                  onRemove={() => toggleFavorite(item.idPlayer)}
                  onPress={() => router.push(`/player/playerDetail?id=${item.idPlayer}` as any)}
                />
              )}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
              style={[styles.favList, { backgroundColor: colors.card, borderColor: colors.border }]}
            />
          )}

          {/* ── Logout ── */}
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: '#FF4D4F', marginTop: 24 }]}
            onPress={handleLogout}
          >
            <ThemedText style={styles.logoutText}>ĐĂNG XUẤT</ThemedText>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </ThemedView>
  );
}

// ─── FavPlayerRow ─────────────────────────────────────────────────────────────
function FavPlayerRow({
  player, colors, onRemove, onPress,
}: {
  player: Player;
  colors: (typeof Colors)['dark'];
  onRemove: () => void;
  onPress: () => void;
}) {
  const thumb = player.cutout || player.thumb;
  return (
    <TouchableOpacity style={styles.favRow} onPress={onPress} activeOpacity={0.8}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={styles.favAvatar} resizeMode="contain" />
      ) : (
        <View style={[styles.favAvatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
          <IconSymbol size={22} name="person.fill" color={colors.primary} />
        </View>
      )}

      <View style={styles.favInfo}>
        <ThemedText style={styles.favName} numberOfLines={1}>
          {player.name}
        </ThemedText>
        <ThemedText style={styles.favSub} numberOfLines={1}>
          {player.team} · {player.position}
        </ThemedText>
      </View>

      <TouchableOpacity
        onPress={onRemove}
        style={styles.favHeart}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.favHeartIcon}>❤️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1 },
  scrollContent:{ flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  inner:        { width: '100%' },

  profileHeader:{ alignItems: 'center', marginBottom: 28 },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 2.5,
    padding: 3, marginBottom: 14, justifyContent: 'center', alignItems: 'center',
  },
  avatarImage:          { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder:    { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  username:             { fontWeight: 'bold' },
  email:                { fontSize: 14, color: '#A0AEC0', marginTop: 4 },

  card:         { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 24 },
  menuItem:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, gap: 14 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText:     { fontSize: 15, fontWeight: '500', flex: 1 },

  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitleRow:{ flexDirection: 'row', alignItems: 'center' },
  sectionTitle:   { fontSize: 16, fontWeight: '700' },
  sectionCount:   { fontSize: 13, color: '#A0AEC0' },

  emptyFav:       { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 8 },
  emptyFavEmoji:  { fontSize: 32, marginBottom: 8 },
  emptyFavText:   { fontSize: 14, fontWeight: '600', textAlign: 'center' },

  favList:              { borderRadius: 16, borderWidth: 1, marginBottom: 4, overflow: 'hidden' },
  favRow:               { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  separator:            { height: 1 },
  favAvatar:            { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  favAvatarPlaceholder: { width: 48, height: 48, borderRadius: 8, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  favInfo:              { flex: 1 },
  favName:              { fontSize: 14, fontWeight: '700' },
  favSub:               { fontSize: 12, color: '#A0AEC0', marginTop: 2 },
  favHeart:             { marginLeft: 10 },
  favHeartIcon:         { fontSize: 18 },

  logoutBtn:    { height: 52, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  logoutText:   { color: '#FF4D4F', fontWeight: '700', fontSize: 15 },
});
