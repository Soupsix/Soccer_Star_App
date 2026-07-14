import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDailyCheckin } from '@/hooks/use-daily-checkin';
import { formatVipDate, useVipMembership, VIP_PRICE } from '@/hooks/use-vip-membership';

const CONTENT_MAX_WIDTH = 640;

type BenefitIcon = 'star.fill' | 'heart.fill' | 'person.fill' | 'envelope.fill' | 'photo';

function BenefitRow({
  icon,
  title,
  description,
  last = false,
  colors,
}: {
  icon: BenefitIcon;
  title: string;
  description: string;
  last?: boolean;
  colors: (typeof Colors)['dark'];
}) {
  return (
    <View style={[styles.benefitRow, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <View style={styles.benefitIcon}>
        <IconSymbol name={icon} size={19} color="#D99A13" />
      </View>
      <View style={styles.benefitCopy}>
        <ThemedText style={styles.benefitTitle}>{title}</ThemedText>
        <Text style={[styles.benefitDescription, { color: colors.icon }]}>{description}</Text>
      </View>
    </View>
  );
}

export default function VipScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 600 ? 32 : 20;
  const isCompact = width < 380;
  const { coins } = useDailyCheckin();
  const {
    isVip,
    vipExpiresAt,
    daysLeft,
    loading,
    purchasing,
    purchaseVip,
  } = useVipMembership();

  const priceText = VIP_PRICE.toLocaleString('vi-VN');
  const expiresLabel = formatVipDate(vipExpiresAt);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const runPurchase = async () => {
    try {
      const result = await purchaseVip();
      showMessage(
        'VIP đã được kích hoạt',
        `Gói VIP Football Star có hiệu lực đến ${formatVipDate(result.expiresAt)}.\nSố dư còn lại: ${result.newTotal.toLocaleString('vi-VN')} coin`,
      );
    } catch (error: any) {
      if (error?.code === 'not-enough-coins') {
        showMessage(
          'Chưa đủ coin',
          `Bạn cần thêm ${Number(error.shortfall || 0).toLocaleString('vi-VN')} coin để mua gói VIP.`,
        );
        return;
      }

      showMessage('Không thể mua VIP', error?.message || 'Vui lòng thử lại sau.');
    }
  };

  const handlePurchase = () => {
    const title = isVip ? 'Gia hạn VIP Football Star' : 'Nâng cấp VIP Football Star';
    const message = `Gói VIP giá ${priceText} coin cho 1 tháng. Coin sẽ được trừ trực tiếp từ ví của bạn.`;

    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) void runPurchase();
      return;
    }

    Alert.alert(title, message, [
      { text: 'Hủy', style: 'cancel' },
      { text: isVip ? 'Gia hạn' : 'Mua VIP', onPress: runPurchase },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>VIP Football Star</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#D99A13" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.content, { maxWidth: CONTENT_MAX_WIDTH }]}>
              <LinearGradient
                colors={isVip ? ['#071313', '#0E4A43', '#8A6618'] : ['#111827', '#17524A', '#2F80ED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statusPanel}
              >
                <View style={styles.statusTopRow}>
                  <View style={styles.statusIcon}>
                    <IconSymbol name="star.fill" size={26} color="#FFE7A3" />
                  </View>
                  <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: isVip ? '#63E6BE' : '#CBD5E1' }]} />
                    <Text style={styles.statusBadgeText}>{isVip ? 'ĐANG HOẠT ĐỘNG' : 'CHƯA KÍCH HOẠT'}</Text>
                  </View>
                </View>

                <Text style={styles.planEyebrow}>GÓI THÀNH VIÊN</Text>
                <Text style={styles.planTitle}>{isVip ? 'VIP Football Star' : 'Football Star thường'}</Text>
                <Text style={styles.planDescription}>
                  {isVip
                    ? `Đặc quyền còn ${daysLeft} ngày${expiresLabel ? `, đến ${expiresLabel}` : ''}.`
                    : 'Nâng cấp hồ sơ để mở giao diện và nhận diện VIP riêng.'}
                </Text>

                <View style={styles.statusMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>THỜI HẠN</Text>
                    <Text style={styles.metricValue}>{isVip ? `${daysLeft} ngày` : '30 ngày'}</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>YÊU THÍCH</Text>
                    <Text style={styles.metricValue}>{isVip ? 'Không giới hạn' : 'Tối đa 3'}</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>SỐ DƯ VÍ</Text>
                    <Text style={styles.metricValue}>{coins.toLocaleString('vi-VN')} coin</Text>
                  </View>
                </View>
              </LinearGradient>

              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Đặc quyền thành viên</ThemedText>
                <Text style={styles.sectionCaption}>Áp dụng ngay sau khi kích hoạt</Text>
              </View>

              <View style={[styles.benefitList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <BenefitRow
                  icon="heart.fill"
                  title={isVip ? 'Yêu thích cầu thủ không giới hạn' : 'Mở khóa yêu thích không giới hạn'}
                  description={
                    isVip
                      ? 'Thêm bao nhiêu cầu thủ yêu thích tùy ý trong suốt thời gian VIP.'
                      : 'Tài khoản thường tối đa 3 cầu thủ; nâng cấp VIP để bỏ giới hạn.'
                  }
                  colors={colors}
                />
                <BenefitRow
                  icon="photo"
                  title="Nền hồ sơ VIP riêng"
                  description="Cover sang trọng giúp hồ sơ khác biệt rõ ràng với thành viên thường."
                  colors={colors}
                />
                <BenefitRow
                  icon="person.fill"
                  title="Tên hiển thị nổi bật"
                  description="Tên thành viên được nhấn mạnh bằng màu sắc VIP đặc trưng."
                  colors={colors}
                />
                <BenefitRow
                  icon="envelope.fill"
                  title="Email nổi bật"
                  description="Thông tin email đồng bộ phong cách nhận diện VIP."
                  colors={colors}
                />
                <BenefitRow
                  icon="star.fill"
                  title="Viền avatar đặc quyền"
                  description="Avatar có viền vàng, hiệu ứng chiều sâu và huy hiệu VIP."
                  colors={colors}
                  last
                />
              </View>

              <View
                style={[
                  styles.purchaseSection,
                  isCompact && styles.purchaseSectionCompact,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.purchaseCopy}>
                  <Text style={[styles.purchaseLabel, { color: colors.icon }]}>GIÁ MỖI THÁNG</Text>
                  <ThemedText style={styles.purchasePrice}>{priceText} coin</ThemedText>
                </View>
                <TouchableOpacity
                  activeOpacity={0.84}
                  disabled={purchasing}
                  onPress={handlePurchase}
                  style={[
                    styles.purchaseButton,
                    isCompact && styles.purchaseButtonCompact,
                    purchasing && styles.purchaseButtonDisabled,
                  ]}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#071313" />
                  ) : (
                    <Text style={styles.purchaseButtonText}>{isVip ? 'Gia hạn 1 tháng' : 'Mua VIP 1 tháng'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 20,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  headerSpacer: { width: 40 },
  loadingState: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  scrollContent: { alignItems: 'center', paddingBottom: 48, paddingTop: 22 },
  content: { width: '100%' },
  statusPanel: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 20,
    shadowColor: '#071313',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 7,
  },
  statusTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  statusIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,231,163,0.12)',
    borderColor: 'rgba(255,231,163,0.34)',
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,20,18,0.36)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusDot: { borderRadius: 4, height: 7, width: 7 },
  statusBadgeText: { color: '#F8FAFC', fontSize: 9, fontWeight: '900' },
  planEyebrow: { color: '#FFE7A3', fontSize: 10, fontWeight: '900', marginTop: 24 },
  planTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 5 },
  planDescription: { color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 19, marginTop: 7 },
  statusMetrics: {
    alignItems: 'center',
    backgroundColor: 'rgba(3,16,15,0.28)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 22,
    paddingVertical: 13,
  },
  metricItem: { alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  metricDivider: { backgroundColor: 'rgba(255,255,255,0.18)', height: 34, width: 1 },
  metricLabel: { color: 'rgba(255,255,255,0.56)', fontSize: 9, fontWeight: '800' },
  metricValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  sectionHeader: { marginBottom: 12, marginTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionCaption: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  benefitList: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 16 },
  benefitRow: { alignItems: 'center', flexDirection: 'row', gap: 13, paddingVertical: 15 },
  benefitIcon: {
    alignItems: 'center',
    backgroundColor: '#F5B82E18',
    borderColor: '#D99A1344',
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  benefitCopy: { flex: 1 },
  benefitTitle: { fontSize: 14, fontWeight: '700' },
  benefitDescription: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  purchaseSection: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginTop: 20,
    padding: 16,
  },
  purchaseCopy: { flex: 1 },
  purchaseSectionCompact: { alignItems: 'stretch', flexDirection: 'column' },
  purchaseLabel: { fontSize: 9, fontWeight: '900' },
  purchasePrice: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  purchaseButton: {
    alignItems: 'center',
    backgroundColor: '#F5B82E',
    borderRadius: 11,
    justifyContent: 'center',
    minHeight: 46,
    minWidth: 148,
    paddingHorizontal: 16,
  },
  purchaseButtonDisabled: { opacity: 0.68 },
  purchaseButtonCompact: { width: '100%' },
  purchaseButtonText: { color: '#071313', fontSize: 13, fontWeight: '900', textAlign: 'center' },
});
