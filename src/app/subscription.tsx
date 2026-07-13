import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SubscriptionService, UserSubscription } from '@/services/subscription.service';
import { useAuthUser } from '@/hooks/use-auth-user';
import { LinearGradient } from 'expo-linear-gradient';

export default function SubscriptionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { user } = useAuthUser();

  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      const data = await SubscriptionService.getUserSubscription(user!.uid);
      setSub(data);
    } catch (error) {
      console.error('Lỗi khi tải thông tin đăng ký:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập trước.');
      return;
    }
    setActionLoading(true);
    try {
      await SubscriptionService.upgradeToPremium(user.uid);
      Alert.alert('Chúc mừng!', 'Bạn đã nâng cấp Premium thành công.');
      await loadSubscription();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể nâng cấp.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy Premium?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy Premium',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await SubscriptionService.cancelPremium(user.uid);
            await loadSubscription();
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể hủy.');
          } finally {
            setActionLoading(false);
          }
        }
      }
    ]);
  };

  if (!user) {
    return (
      <ThemedView style={styles.centerContainer}>
        <FontAwesome name="lock" size={48} color={colors.icon} />
        <ThemedText style={{ marginTop: 16 }}>Vui lòng đăng nhập để xem thông tin gói cước.</ThemedText>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
          <ThemedText>Quay lại</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  const isPremium = sub?.isPremium;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <FontAwesome name="chevron-left" size={16} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={{ flex: 1, textAlign: 'center' }}>SoccerStar Premium</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Current Plan Card */}
        <View style={[styles.currentPlanCard, { backgroundColor: isPremium ? '#FFD70015' : colors.card, borderColor: isPremium ? '#FFD700' : colors.border }]}>
          <View style={styles.planHeader}>
            <FontAwesome name={isPremium ? 'star' : 'user'} size={24} color={isPremium ? '#FFD700' : colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <ThemedText style={{ fontSize: 13, color: '#A0AEC0' }}>Gói hiện tại</ThemedText>
              <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: isPremium ? '#FFD700' : colors.text }}>
                {isPremium ? 'Premium Member' : 'Gói Miễn Phí'}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.usageContainer}>
            <ThemedText style={{ fontSize: 14 }}>
              Đã theo dõi: <ThemedText style={{ fontWeight: 'bold' }}>{sub?.followedPlayers.length || 0}</ThemedText> {isPremium ? '' : '/ 3'} cầu thủ
            </ThemedText>
          </View>

          {isPremium && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={actionLoading}>
              <ThemedText style={{ color: '#E53935', fontSize: 13, fontWeight: '600' }}>Hủy đăng ký</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Upgrade Card */}
        {!isPremium && (
          <LinearGradient
            colors={['#1a2a6c', '#11998e', '#38ef7d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeCard}
          >
            <View style={styles.upgradeHeader}>
              <FontAwesome name="diamond" size={28} color="#FFF" />
              <Text style={styles.upgradeTitle}>Nâng cấp Premium</Text>
            </View>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <FontAwesome name="check-circle" size={16} color="#38ef7d" />
                <Text style={styles.featureText}>Theo dõi cầu thủ không giới hạn</Text>
              </View>
              <View style={styles.featureItem}>
                <FontAwesome name="check-circle" size={16} color="#38ef7d" />
                <Text style={styles.featureText}>Widget tiện ích màn hình nền</Text>
              </View>
              <View style={styles.featureItem}>
                <FontAwesome name="check-circle" size={16} color="#38ef7d" />
                <Text style={styles.featureText}>Chủ đề giao diện (Themes)</Text>
              </View>
              <View style={styles.featureItem}>
                <FontAwesome name="check-circle" size={16} color="#38ef7d" />
                <Text style={styles.featureText}>Quyền truy cập sớm AI (Early AI)</Text>
              </View>
              <View style={styles.featureItem}>
                <FontAwesome name="check-circle" size={16} color="#38ef7d" />
                <Text style={styles.featureText}>Thống kê chuyên sâu (Statistics)</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.upgradeBtn} 
              onPress={handleUpgrade}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#1a2a6c" />
              ) : (
                <Text style={styles.upgradeBtnText}>Nâng cấp ngay (Demo)</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(113, 128, 150, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPlanCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  usageContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  upgradeCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 12,
  },
  featureList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: '#FFF',
    fontSize: 15,
    marginLeft: 10,
    fontWeight: '500',
  },
  upgradeBtn: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#1a2a6c',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
