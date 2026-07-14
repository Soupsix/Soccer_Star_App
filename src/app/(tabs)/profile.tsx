import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import { useAuthUser } from '@/hooks/use-auth-user';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDailyCheckin } from '@/hooks/use-daily-checkin';
import { useFavorites } from '@/hooks/use-favorites';
import { useVipMembership } from '@/hooks/use-vip-membership';
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
  const isDark      = colorScheme === 'dark';
  const { width }   = useWindowDimensions();
  const isWide      = width >= 600;
  const hPad        = isWide ? 32 : 24;

  // ── Reactive auth user ─────────────────────────────────────────────────────
  const { user, refreshUser } = useAuthUser();

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  // ── Reactive favorites ─────────────────────────────────────────────────────
  const { favorites, toggleFavorite } = useFavorites();
  const favPlayers = (playersData as Player[]).filter((p) =>
    favorites.includes(p.idPlayer),
  );

  // ── Daily check-in ─────────────────────────────────────────────────────────
  const { coins, hasCheckedInToday, checkingIn, performCheckIn, dailyReward } = useDailyCheckin();
  const {
    isVip,
    daysLeft,
  } = useVipMembership();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [rewardText, setRewardText] = useState('');

  const showRewardAnimation = useCallback((text: string) => {
    setRewardText(text);
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      }, 2200);
    });
  }, [fadeAnim, slideAnim]);

  const handleCheckIn = useCallback(async () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.93, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();

    const result = await performCheckIn();
    if (result.success) {
      showRewardAnimation(`+${result.earned.toLocaleString()} 🪙`);
      Alert.alert(
        '🎉 Điểm danh thành công!',
        `Bạn nhận được ${result.earned.toLocaleString()} coin hôm nay!\n\n💰 Số dư: ${result.newTotal.toLocaleString()} coin`,
        [{ text: 'Tuyệt vời!', style: 'default' }],
      );
    } else {
      Alert.alert('Thông báo', result.message);
    }
  }, [performCheckIn, pulseAnim, showRewardAnimation]);

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

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const cardBg  = isDark ? colors.card : '#fff';

  const profileIdentity = (
    <View style={[styles.profileHeader, isVip && styles.profileHeaderVip]}>
      <View
        style={[
          styles.avatarRing,
          isVip ? styles.avatarRingVip : { borderColor: colors.primary + '55' },
        ]}
      >
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: isVip ? 'rgba(255,255,255,0.14)' : colors.primary + '22' },
            ]}
          >
            <IconSymbol size={40} name="person.fill" color={isVip ? '#FFE7A3' : colors.primary} />
          </View>
        )}
        {isVip && (
          <View style={styles.vipAvatarBadge}>
            <Text style={styles.vipAvatarBadgeText}>VIP</Text>
          </View>
        )}
      </View>
      <ThemedText
        type="subtitle"
        style={[
          styles.username,
          { fontSize: isWide ? 24 : 20 },
          isVip && styles.vipUsername,
        ]}
      >
        {user?.displayName || 'Thành viên Football Star'}
      </ThemedText>
      <ThemedText style={[styles.email, isVip && styles.vipEmail]}>{user?.email}</ThemedText>

      <View
        style={[
          styles.coinPill,
          {
            backgroundColor: isVip ? 'rgba(7,18,18,0.34)' : '#FFD70018',
            borderColor: isVip ? 'rgba(255,231,163,0.48)' : '#FFD70050',
          },
        ]}
      >
        <Text style={styles.coinPillEmoji}>🪙</Text>
        <Text
          style={[
            styles.coinPillText,
            { color: isVip ? '#FFE7A3' : isDark ? '#FFA000' : '#D97706' },
          ]}
        >
          {coins.toLocaleString()} coin
        </Text>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: hPad, paddingTop: isWide ? 60 : 80 },
        ]}
      >
        <View style={[styles.inner, { maxWidth: CONTENT_MAX_WIDTH }]}>

          {isVip ? (
            <LinearGradient
              colors={['#071313', '#0E4A43', '#8A6618']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vipProfileCover}
            >
              <View style={styles.vipCoverTopRow}>
                <View style={styles.vipCoverBrand}>
                  <IconSymbol size={15} name="star.fill" color="#FFE7A3" />
                  <Text style={styles.vipCoverBrandText}>VIP FOOTBALL STAR</Text>
                </View>
                <View style={styles.vipCoverStatus}>
                  <View style={styles.vipCoverStatusDot} />
                  <Text style={styles.vipCoverStatusText}>ĐANG HOẠT ĐỘNG</Text>
                </View>
              </View>
              {profileIdentity}
            </LinearGradient>
          ) : (
            profileIdentity
          )}

          {/* ─── Daily Check-in Card ─── */}
          {!hasCheckedInToday && (
            <View style={[styles.checkinCard, {
              backgroundColor: isDark ? '#0d1829' : '#edf2ff',
              borderColor: colors.primary + '55',
            }]}>

              {/* Card top row */}
              <View style={styles.checkinTopRow}>
                <View style={styles.checkinTitleGroup}>
                  <Text style={styles.checkinTitleIcon}>📅</Text>
                  <ThemedText style={styles.checkinTitleText}>Điểm danh hàng ngày</ThemedText>
                </View>
              </View>

              {/* Stats row */}
              <View style={[styles.statsRow, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }]}>
                {/* Reward */}
                <View style={styles.statItem}>
                  <Text style={styles.statEmoji}>🎁</Text>
                  <View>
                    <Text style={[styles.statValue, { color: isDark ? '#FFA000' : '#D97706' }]}>
                      +{dailyReward.toLocaleString()}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.icon }]}>coin hôm nay</Text>
                  </View>
                </View>

                <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />

                {/* Balance */}
                <View style={styles.statItem}>
                  <Text style={styles.statEmoji}>💰</Text>
                  <View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {coins.toLocaleString()}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.icon }]}>số dư ví</Text>
                  </View>
                </View>
              </View>

              {/* Check-in button */}
              <Animated.View style={[styles.checkinBtnOuter, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                  style={[
                    styles.checkinBtn,
                    { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 7 },
                  ]}
                  onPress={handleCheckIn}
                  disabled={checkingIn}
                  activeOpacity={0.82}
                >
                  {checkingIn ? (
                    <Text style={[styles.checkinBtnPrimary, { color: '#fff' }]}>⏳ Đang xử lý...</Text>
                  ) : (
                    <>
                      <Text style={[styles.checkinBtnPrimary, { color: '#fff' }]}>
                        🎁 Nhận {dailyReward.toLocaleString()} coin
                      </Text>
                      <Text style={[styles.checkinBtnSub, { color: 'rgba(255,255,255,0.72)' }]}>
                        Nhấn để điểm danh ngay!
                      </Text>
                    </>
                  )}

                  {/* Floating reward badge */}
                  <Animated.View
                    style={[
                      styles.floatingBadge,
                      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                    pointerEvents="none"
                  >
                    <Text style={styles.floatingBadgeText}>{rewardText}</Text>
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>

              {/* Reset hint */}
              <Text style={[styles.checkinHint, { color: colors.icon }]}>
                🔄 Reset lúc 00:00 mỗi ngày · Điểm danh đều đặn để tích coin
              </Text>
            </View>
          )}

          {/* ── Menu card ── */}
          <View style={[styles.menuCard, { backgroundColor: cardBg, borderColor: colors.border }]}>

            <TouchableOpacity
              style={[styles.menuRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push('/profile/vip' as any)}
            >
              <View style={[styles.menuIcon, styles.vipMenuIcon]}>
                <IconSymbol size={18} name="star.fill" color="#D99A13" />
              </View>
              <View style={styles.menuCopy}>
                <ThemedText style={styles.menuTitle}>VIP Football Star</ThemedText>
                <Text style={[styles.menuMeta, { color: isVip ? '#B7791F' : colors.icon }]}>
                  {isVip ? `Đang hoạt động · còn ${daysLeft} ngày` : '50.000 coin / 1 tháng'}
                </Text>
              </View>
              {isVip && (
                <View style={styles.vipMenuBadge}>
                  <Text style={styles.vipMenuBadgeText}>VIP</Text>
                </View>
              )}
              <IconSymbol size={15} name="chevron.right" color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push('/profile/personal-info')}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '18' }]}>
                <IconSymbol size={18} name="person.fill" color={colors.primary} />
              </View>
              <ThemedText style={styles.menuLabel}>Thông tin cá nhân</ThemedText>
              <IconSymbol size={15} name="chevron.right" color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push('/profile/coin-wallet' as any)}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#FFD700' + '18' }]}>
                <Text style={{ fontSize: 17 }}>🪙</Text>
              </View>
              <ThemedText style={styles.menuLabel}>Ví coin</ThemedText>
              <View style={[styles.menuBadge, { backgroundColor: '#FFD700' + '22' }]}>
                <Text style={[styles.menuBadgeText, { color: isDark ? '#FFA000' : '#D97706' }]}>
                  {coins.toLocaleString()}
                </Text>
              </View>
              <IconSymbol size={15} name="chevron.right" color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuRow, { borderBottomColor: 'transparent' }]}
              onPress={() => router.push('/profile/personal-info?tab=notifications')}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '18' }]}>
                <IconSymbol size={18} name="bell.fill" color={colors.primary} />
              </View>
              <ThemedText style={styles.menuLabel}>Cài đặt thông báo</ThemedText>
              <IconSymbol size={15} name="chevron.right" color={colors.icon} />
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
            <ThemedText style={[styles.sectionCount, { color: colors.icon }]}>
              {favPlayers.length} cầu thủ
            </ThemedText>
          </View>

          {favPlayers.length === 0 ? (
            <View style={[styles.emptyFav, { backgroundColor: cardBg, borderColor: colors.border }]}>
              <Text style={styles.emptyFavEmoji}>💔</Text>
              <ThemedText style={styles.emptyFavText}>
                Bạn chưa yêu thích cầu thủ nào.
              </ThemedText>
              <ThemedText style={{ color: colors.icon, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
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
              style={[styles.favList, { backgroundColor: cardBg, borderColor: colors.border }]}
            />
          )}

          {/* ── Logout ── */}
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: '#FF4D4F33' }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
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
        <ThemedText style={styles.favName} numberOfLines={1}>{player.name}</ThemedText>
        <ThemedText style={styles.favSub} numberOfLines={1}>
          {player.team} · {player.position}
        </ThemedText>
      </View>
      <TouchableOpacity
        onPress={onRemove}
        style={styles.favHeart}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={{ fontSize: 18 }}>❤️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1 },
  scrollContent:{ flexGrow: 1, alignItems: 'center', paddingBottom: 48 },
  inner:        { width: '100%' },

  // ── Avatar section ──
  profileHeader:  { alignItems: 'center', marginBottom: 22 },
  profileHeaderVip: { marginBottom: 0, paddingBottom: 20 },
  vipProfileCover: {
    borderRadius: 18,
    marginBottom: 22,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 16,
    shadowColor: '#071313',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 7,
  },
  vipCoverTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  vipCoverBrand: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  vipCoverBrandText: { color: '#FFE7A3', fontSize: 11, fontWeight: '900' },
  vipCoverStatus: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,25,22,0.4)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  vipCoverStatusDot: { backgroundColor: '#63E6BE', borderRadius: 4, height: 6, width: 6 },
  vipCoverStatusText: { color: '#D8FFF4', fontSize: 9, fontWeight: '900' },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 2.5,
    padding: 3, marginBottom: 14, justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  avatarRingVip: {
    borderColor: '#F59E0B',
    borderWidth: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarImage:       { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  username:          { fontWeight: 'bold' },
  vipUsername:       { color: '#FFF8E1', fontWeight: '900' },
  email:             { fontSize: 14, color: '#A0AEC0', marginTop: 4 },
  vipEmail:          { color: '#F6E6B5', fontWeight: '700' },
  vipAvatarBadge: {
    position: 'absolute',
    bottom: -7,
    alignSelf: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  vipAvatarBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  coinPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 12,
  },
  coinPillEmoji: { fontSize: 16 },
  coinPillText:  { fontSize: 15, fontWeight: '700' },

  // ── Check-in card ──
  checkinCard: {
    borderRadius: 20, borderWidth: 1.5, padding: 18,
    marginBottom: 20, gap: 14,
  },
  checkinTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkinTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkinTitleIcon:  { fontSize: 20 },
  checkinTitleText:  { fontSize: 16, fontWeight: '700' },
  checkinBadge: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  checkinBadgeText: { fontSize: 11, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    padding: 14,
  },
  statItem:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statEmoji:   { fontSize: 26 },
  statValue:   { fontSize: 18, fontWeight: '800' },
  statLabel:   { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 36, marginHorizontal: 10 },

  checkinBtnOuter: { alignItems: 'stretch' },
  checkinBtn: {
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', gap: 3,
    overflow: 'hidden',
  },
  checkinBtnPrimary: { fontSize: 16, fontWeight: '700' },
  checkinBtnSub:     { fontSize: 12 },

  floatingBadge: {
    position: 'absolute', top: -36, alignSelf: 'center',
    backgroundColor: '#FFD700', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 5,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 10,
  },
  floatingBadgeText: { fontSize: 15, fontWeight: '900', color: '#000' },

  checkinHint: { fontSize: 11, textAlign: 'center', lineHeight: 17 },

  // ── Menu card ──
  menuCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 22 },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, borderBottomWidth: 1, gap: 13,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel:{ fontSize: 15, fontWeight: '500', flex: 1 },
  menuCopy: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700' },
  menuMeta: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  menuBadge:{ borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4 },
  menuBadgeText: { fontSize: 12, fontWeight: '700' },
  vipMenuIcon: {
    backgroundColor: '#F5B82E1A',
    borderColor: '#D99A1344',
    borderWidth: 1,
  },
  vipMenuBadge: {
    backgroundColor: '#F5B82E20',
    borderColor: '#D99A1355',
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  vipMenuBadgeText: { color: '#B7791F', fontSize: 10, fontWeight: '900' },

  // ── Section header ──
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitleRow:{ flexDirection: 'row', alignItems: 'center' },
  sectionTitle:   { fontSize: 16, fontWeight: '700' },
  sectionCount:   { fontSize: 13 },

  // ── Empty fav ──
  emptyFav:     { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 8 },
  emptyFavEmoji:{ fontSize: 32, marginBottom: 8 },
  emptyFavText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },

  // ── Fav list ──
  favList:              { borderRadius: 16, borderWidth: 1, marginBottom: 4, overflow: 'hidden' },
  favRow:               { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  separator:            { height: 1 },
  favAvatar:            { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  favAvatarPlaceholder: { width: 48, height: 48, borderRadius: 8, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  favInfo:              { flex: 1 },
  favName:              { fontSize: 14, fontWeight: '700' },
  favSub:               { fontSize: 12, color: '#A0AEC0', marginTop: 2 },
  favHeart:             { marginLeft: 10 },

  // ── Logout ──
  logoutBtn: {
    height: 50, borderRadius: 12, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center', marginTop: 20,
    backgroundColor: '#FF4D4F10',
  },
  logoutText: { color: '#FF4D4F', fontWeight: '700', fontSize: 15 },
});
