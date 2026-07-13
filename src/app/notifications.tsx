import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { auth, db } from '@/services/firebase';

interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'mock_noti_1',
    userId: 'current_user',
    title: 'Yêu cầu kết bạn mới 👥',
    message: 'Nguyễn Huy đã gửi cho bạn lời mời kết bạn.',
    isRead: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 'mock_noti_2',
    userId: 'current_user',
    title: 'Lượt thích mới ❤️',
    message: 'CR7 Lover đã thích bài viết Locket của bạn về Cristiano Ronaldo.',
    isRead: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hrs ago
  },
  {
    id: 'mock_noti_3',
    userId: 'current_user',
    title: 'Bình luận mới 💬',
    message: 'Tùng Chelsea đã phản hồi: "Đồng quan điểm, quả đấy sút đỉnh thật!"',
    isRead: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hrs ago
  },
  {
    id: 'mock_noti_4',
    userId: 'current_user',
    title: 'Trận đấu HOT hôm nay 🔥⚽',
    message: 'Trận cầu tâm điểm giữa Real Madrid vs Barcelona sẽ diễn ra vào 02:00 đêm nay!',
    isRead: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10 hrs ago
  }
];

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AppNotification[];

      if (list.length === 0) {
        // Fallback to mock data if Firestore has none
        setNotifications(MOCK_NOTIFICATIONS);
      } else {
        setNotifications(list);
      }
    } catch (err) {
      console.warn('Error loading notifications, falling back to mock data:', err);
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    // Optimistic local state update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );

    if (notificationId.startsWith('mock_')) return;

    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    const firestoreUnreadIds = unreadIds.filter((id) => !id.startsWith('mock_'));
    if (firestoreUnreadIds.length === 0) return;

    try {
      const batch = writeBatch(db);
      firestoreUnreadIds.forEach((id) => {
        batch.update(doc(db, 'notifications', id), { isRead: true });
      });
      await batch.commit();
      Alert.alert('Thành công', 'Đã đánh dấu đọc toàn bộ thông báo.');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getIconAndColor = (title: string) => {
    if (title.includes('kết bạn') || title.includes('👥')) {
      return { name: 'people-circle-outline' as const, color: colors.primary };
    }
    if (title.includes('thích') || title.includes('❤️')) {
      return { name: 'heart-circle-outline' as const, color: '#FF4D4F' };
    }
    if (title.includes('bình luận') || title.includes('💬')) {
      return { name: 'chatbubble-ellipses-outline' as const, color: '#4DA6FF' };
    }
    return { name: 'football-outline' as const, color: colors.gold };
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header Title with Mark All Read Action */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => require('expo-router').router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ThemedText type="title" style={styles.headerTitle}>Thông báo 🔔</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Cập nhật các hoạt động mới nhất từ bạn bè và giải đấu
            </ThemedText>
          </View>
          {notifications.some((n) => !n.isRead) && (
            <TouchableOpacity style={styles.markReadBtn} onPress={markAllAsRead}>
              <Ionicons name="checkmark-done" size={16} color={colors.primary} />
              <ThemedText style={[styles.markReadText, { color: colors.primary }]}>Đọc hết</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: 10, color: colors.icon }}>Đang tải thông báo...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => {
              const { name: iconName, color: iconColor } = getIconAndColor(item.title);
              return (
                <TouchableOpacity
                  style={[
                    styles.notificationCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    !item.isRead && [styles.unreadCard, { borderLeftColor: colors.primary }]
                  ]}
                  onPress={() => markAsRead(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name={iconName} size={28} color={iconColor} />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                      <ThemedText style={[styles.notiTitle, !item.isRead && styles.boldText]}>
                        {item.title}
                      </ThemedText>
                      {!item.isRead && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <ThemedText style={[styles.notiMsg, !item.isRead && { color: colors.text }]}>
                      {item.message}
                    </ThemedText>
                    <ThemedText style={styles.notiTime}>
                      {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.icon} />
                <ThemedText style={styles.emptyTextTitle}>Không có thông báo nào</ThemedText>
                <ThemedText style={styles.emptyTextDesc}>
                  Các thông báo về lượt thích, bình luận, kết bạn và trận đấu sẽ xuất hiện ở đây.
                </ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#A0AEC0',
    fontSize: 13,
    marginTop: 4,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  unreadCard: {
    borderLeftWidth: 4,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0AEC0',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notiMsg: {
    fontSize: 13,
    color: '#A0AEC0',
    lineHeight: 18,
    marginTop: 4,
  },
  notiTime: {
    fontSize: 11,
    color: '#718096',
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyTextTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyTextDesc: {
    color: '#A0AEC0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
});
