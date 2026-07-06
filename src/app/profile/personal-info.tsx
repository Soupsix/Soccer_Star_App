import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Switch,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/services/firebase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthUser } from '@/hooks/use-auth-user';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

// ─── Constants ───────────────────────────────────────────────────────────────
const CONTENT_MAX_WIDTH = 640;

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = 'view' | 'edit' | 'avatar' | 'password' | 'notifications';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { key: 'view',          label: 'Xem hồ sơ',   icon: 'person.fill' },
  { key: 'edit',          label: 'Chỉnh sửa',    icon: 'pencil'      },
  { key: 'avatar',        label: 'Ảnh đại diện', icon: 'photo'       },
  { key: 'password',      label: 'Mật khẩu',     icon: 'lock.fill'   },
  { key: 'notifications', label: 'Thông báo',    icon: 'bell.fill'   },
];

// ─── Responsive hook ─────────────────────────────────────────────────────────
function useResponsive() {
  const { width } = useWindowDimensions();
  const isWide    = width >= 600;
  const isMedium  = width >= 400;
  return {
    width,
    isWide,
    isMedium,
    hPad:        isWide ? 32 : 20,
    avatarSize:  isWide ? 120 : 100,
    headerFs:    isWide ? 22  : 17,
    sectionTitleFs: isWide ? 22 : 20,
    bodyFs:      isWide ? 16  : 15,
    inputH:      isWide ? 56  : 52,
    btnH:        isWide ? 56  : 52,
    tabLabelFs:  isWide ? 14  : 13,
  };
}

// ─── ViewProfile ──────────────────────────────────────────────────────────────
function ViewProfile({ colors, user }: { colors: (typeof Colors)['dark']; user: ReturnType<typeof useAuthUser>['user'] }) {
  const r    = useResponsive();
  const name = user?.displayName || 'Thành viên Football Star';
  const email   = user?.email    ?? '—';
  const created = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN')
    : '—';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: r.hPad, paddingVertical: 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.innerColumn, { maxWidth: CONTENT_MAX_WIDTH }]}>

        {/* Avatar */}
        <View style={styles.avatarBlock}>
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={{
                width: r.avatarSize,
                height: r.avatarSize,
                borderRadius: r.avatarSize / 2,
              }}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                {
                  width: r.avatarSize,
                  height: r.avatarSize,
                  borderRadius: r.avatarSize / 2,
                  backgroundColor: colors.primary + '25',
                },
              ]}
            >
              <IconSymbol size={r.avatarSize * 0.42} name="person.fill" color={colors.primary} />
            </View>
          )}
          <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
        </View>

        {/* Info cards */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow icon="person.fill"  label="Tên hiển thị" value={name}  colors={colors} bodyFs={r.bodyFs} />
          <InfoRow icon="envelope.fill" label="Email"        value={email} colors={colors} bodyFs={r.bodyFs} last />
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow icon="calendar" label="Ngày tham gia" value={created} colors={colors} bodyFs={r.bodyFs} last />
        </View>

        {/* Badge */}
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' },
          ]}
        >
          <IconSymbol size={16} name="star.fill" color={colors.primary} />
          <ThemedText style={[styles.badgeText, { color: colors.primary }]}>
            Thành viên Football Star
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({
  icon, label, value, colors, last, bodyFs,
}: {
  icon: string; label: string; value: string;
  colors: (typeof Colors)['dark']; last?: boolean; bodyFs: number;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + '18' }]}>
        <IconSymbol size={16} name={icon as any} color={colors.primary} />
      </View>
      <View style={styles.infoTextGroup}>
        <ThemedText style={styles.infoLabel}>{label}</ThemedText>
        <ThemedText style={[styles.infoValue, { fontSize: bodyFs }]}>{value}</ThemedText>
      </View>
    </View>
  );
}

// ─── EditProfile ──────────────────────────────────────────────────────────────
function EditProfile({ colors, user, onSaved }: { colors: (typeof Colors)['dark']; user: ReturnType<typeof useAuthUser>['user']; onSaved: () => void }) {
  const r    = useResponsive();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setMessage({ text: 'Tên hiển thị không được để trống.', ok: false });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      if (user) {
        await updateProfile(user, { displayName: displayName.trim() });
        await setDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() }, { merge: true });
      }
      setMessage({ text: 'Cập nhật thành công!', ok: true });
      onSaved(); // notify parent → refreshUser() → ViewProfile re-renders
    } catch (e: any) {
      setMessage({ text: 'Lỗi: ' + (e.message ?? 'Không thể cập nhật.'), ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: r.hPad, paddingVertical: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerColumn, { maxWidth: CONTENT_MAX_WIDTH }]}>
          <ThemedText style={[styles.sectionTitle, { fontSize: r.sectionTitleFs }]}>Chỉnh sửa hồ sơ</ThemedText>
          <ThemedText style={[styles.sectionDesc, { color: '#A0AEC0', fontSize: r.bodyFs - 2 }]}>
            Cập nhật thông tin cá nhân của bạn.
          </ThemedText>

          {message && (
            <Banner ok={message.ok} text={message.text} colors={colors} />
          )}

          <FormField
            label="TÊN HIỂN THỊ" placeholder="Nhập tên hiển thị..."
            value={displayName} onChangeText={setDisplayName}
            colors={colors} inputH={r.inputH} bodyFs={r.bodyFs}
          />
          <FormField
            label="EMAIL" placeholder=""
            value={user?.email ?? ''} onChangeText={() => {}}
            colors={colors} editable={false}
            hint="Email không thể thay đổi trực tiếp."
            inputH={r.inputH} bodyFs={r.bodyFs}
          />

          <PrimaryButton label="LƯU THAY ĐỔI" loading={loading} onPress={handleSave}
            colors={colors} btnH={r.btnH} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── ChangeAvatar ─────────────────────────────────────────────────────────────
function ChangeAvatar({ colors, user, onSaved }: { colors: (typeof Colors)['dark']; user: ReturnType<typeof useAuthUser>['user']; onSaved: () => void }) {
  const r    = useResponsive();
  const [url, setUrl]         = useState(user?.photoURL ?? '');
  const [preview, setPreview] = useState(user?.photoURL ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [imgError, setImgError] = useState(false);

  const previewSize = Math.min(r.avatarSize * 1.2, 140);

  const handleSave = async () => {
    if (!url.trim()) {
      setMessage({ text: 'Vui lòng nhập URL ảnh đại diện.', ok: false });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      if (user) {
        await updateProfile(user, { photoURL: url.trim() });
        await setDoc(doc(db, 'users', user.uid), { photoURL: url.trim() }, { merge: true });
      }
      setMessage({ text: 'Cập nhật ảnh đại diện thành công!', ok: true });
      onSaved(); // notify parent → refreshUser() → ViewProfile + Profile tab re-render
    } catch (e: any) {
      setMessage({ text: 'Lỗi: ' + (e.message ?? 'Không thể cập nhật.'), ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: r.hPad, paddingVertical: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerColumn, { maxWidth: CONTENT_MAX_WIDTH }]}>
          <ThemedText style={[styles.sectionTitle, { fontSize: r.sectionTitleFs }]}>Thay đổi ảnh đại diện</ThemedText>
          <ThemedText style={[styles.sectionDesc, { color: '#A0AEC0', fontSize: r.bodyFs - 2 }]}>
            Nhập URL ảnh trực tuyến để thay đổi avatar.
          </ThemedText>

          {/* Preview */}
          <View style={styles.avatarPreviewWrap}>
            {preview && !imgError ? (
              <Image
                source={{ uri: preview }}
                style={{ width: previewSize, height: previewSize, borderRadius: previewSize / 2 }}
                onError={() => setImgError(true)}
              />
            ) : (
              <View
                style={[
                  { width: previewSize, height: previewSize, borderRadius: previewSize / 2,
                    backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
                ]}
              >
                <IconSymbol size={previewSize * 0.38} name="person.fill" color={colors.primary} />
              </View>
            )}
            <View style={[styles.previewBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={{ fontSize: 11, color: '#A0AEC0' }}>XEM TRƯỚC</ThemedText>
            </View>
          </View>

          {message && <Banner ok={message.ok} text={message.text} colors={colors} />}

          <FormField
            label="URL ẢNH ĐẠI DIỆN" placeholder="https://example.com/avatar.jpg"
            value={url} onChangeText={setUrl} colors={colors}
            autoCapitalize="none" keyboardType="url"
            inputH={r.inputH} bodyFs={r.bodyFs}
          />

          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.border, height: r.btnH }]}
            onPress={() => { setImgError(false); setPreview(url.trim()); }}
          >
            <IconSymbol size={16} name="eye.fill" color={colors.text} />
            <ThemedText style={[styles.outlineBtnText, { color: colors.text, fontSize: r.bodyFs - 1 }]}>
              Xem trước
            </ThemedText>
          </TouchableOpacity>

          <PrimaryButton label="LƯU ẢNH ĐẠI DIỆN" loading={loading} onPress={handleSave}
            colors={colors} btnH={r.btnH} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── ChangePassword ───────────────────────────────────────────────────────────
function ChangePassword({ colors }: { colors: (typeof Colors)['dark'] }) {
  const r = useResponsive();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading]       = useState(false);
  const [message, setMessage]       = useState<{ text: string; ok: boolean } | null>(null);
  const [showC, setShowC]   = useState(false);
  const [showN, setShowN]   = useState(false);
  const [showCf, setShowCf] = useState(false);

  const handleChange = async () => {
    setMessage(null);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setMessage({ text: 'Vui lòng điền đầy đủ thông tin.', ok: false }); return;
    }
    if (newPwd.length < 6) {
      setMessage({ text: 'Mật khẩu mới phải chứa ít nhất 6 ký tự.', ok: false }); return;
    }
    if (newPwd !== confirmPwd) {
      setMessage({ text: 'Xác nhận mật khẩu không khớp.', ok: false }); return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('Người dùng chưa đăng nhập.');
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);
      setMessage({ text: 'Đổi mật khẩu thành công!', ok: true });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e: any) {
      let msg = 'Không thể đổi mật khẩu.';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential')
        msg = 'Mật khẩu hiện tại không chính xác.';
      else if (e.code === 'auth/weak-password') msg = 'Mật khẩu mới quá yếu.';
      else if (e.message) msg = e.message;
      setMessage({ text: msg, ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: r.hPad, paddingVertical: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerColumn, { maxWidth: CONTENT_MAX_WIDTH }]}>
          <ThemedText style={[styles.sectionTitle, { fontSize: r.sectionTitleFs }]}>Thay đổi mật khẩu</ThemedText>
          <ThemedText style={[styles.sectionDesc, { color: '#A0AEC0', fontSize: r.bodyFs - 2 }]}>
            Nhập mật khẩu hiện tại để xác thực, sau đó nhập mật khẩu mới.
          </ThemedText>

          {message && <Banner ok={message.ok} text={message.text} colors={colors} />}

          <PasswordField label="MẬT KHẨU HIỆN TẠI" placeholder="Nhập mật khẩu hiện tại..."
            value={currentPwd} onChangeText={setCurrentPwd}
            show={showC} onToggle={() => setShowC(!showC)}
            colors={colors} inputH={r.inputH} bodyFs={r.bodyFs} />
          <PasswordField label="MẬT KHẨU MỚI" placeholder="Ít nhất 6 ký tự..."
            value={newPwd} onChangeText={setNewPwd}
            show={showN} onToggle={() => setShowN(!showN)}
            colors={colors} inputH={r.inputH} bodyFs={r.bodyFs} />
          <PasswordField label="XÁC NHẬN MẬT KHẨU MỚI" placeholder="Nhập lại mật khẩu mới..."
            value={confirmPwd} onChangeText={setConfirmPwd}
            show={showCf} onToggle={() => setShowCf(!showCf)}
            colors={colors} inputH={r.inputH} bodyFs={r.bodyFs} />

          <PrimaryButton label="ĐỔI MẬT KHẨU" loading={loading} onPress={handleChange}
            colors={colors} btnH={r.btnH} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── NotificationSettings ─────────────────────────────────────────────────────
const NOTIF_SETTINGS = [
  { key: 'matchStart',        label: 'Bắt đầu trận đấu',   desc: 'Nhận thông báo khi trận đấu bắt đầu',        icon: 'sportscourt.fill'    },
  { key: 'predictionResult',  label: 'Kết quả dự đoán',    desc: 'Thông báo kết quả dự đoán của bạn',           icon: 'chart.bar.fill'      },
  { key: 'newMatches',        label: 'Trận đấu mới',        desc: 'Thông báo khi có trận đấu mới được thêm',    icon: 'plus.circle.fill'    },
  { key: 'weeklyDigest',      label: 'Tổng kết hàng tuần', desc: 'Tóm tắt hoạt động mỗi tuần',                 icon: 'calendar.badge.clock'},
  { key: 'promotions',        label: 'Khuyến mãi & Ưu đãi',desc: 'Thông báo về các sự kiện đặc biệt',          icon: 'gift.fill'           },
];

function NotificationSettings({ colors }: { colors: (typeof Colors)['dark'] }) {
  const r = useResponsive();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    matchStart: true, predictionResult: true, newMatches: false,
    weeklyDigest: true, promotions: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const toggle = (key: string) => { setSettings(p => ({ ...p, [key]: !p[key] })); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) await setDoc(doc(db, 'users', user.uid), { notificationSettings: settings }, { merge: true });
      setSaved(true);
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt thông báo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingHorizontal: r.hPad, paddingVertical: 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.innerColumn, { maxWidth: CONTENT_MAX_WIDTH }]}>
        <ThemedText style={[styles.sectionTitle, { fontSize: r.sectionTitleFs }]}>Cài đặt thông báo</ThemedText>
        <ThemedText style={[styles.sectionDesc, { color: '#A0AEC0', fontSize: r.bodyFs - 2 }]}>
          Tùy chỉnh những thông báo bạn muốn nhận.
        </ThemedText>

        {saved && (
          <Banner ok text="✓ Đã lưu cài đặt thông báo." colors={colors} />
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {NOTIF_SETTINGS.map((item, idx) => (
            <View
              key={item.key}
              style={[
                styles.notifRow,
                idx < NOTIF_SETTINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + '18' }]}>
                <IconSymbol size={16} name={item.icon as any} color={colors.primary} />
              </View>
              <View style={styles.notifTextGroup}>
                <ThemedText style={[styles.notifLabel, { fontSize: r.bodyFs - 1 }]}>{item.label}</ThemedText>
                <ThemedText style={[styles.notifDesc, { color: '#A0AEC0' }]}>{item.desc}</ThemedText>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={settings[item.key] ? colors.primary : '#A0AEC0'}
              />
            </View>
          ))}
        </View>

        <PrimaryButton label="LƯU CÀI ĐẶT" loading={saving} onPress={handleSave}
          colors={colors} btnH={r.btnH} />
      </View>
    </ScrollView>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Banner({ ok, text, colors }: { ok: boolean; text: string; colors: (typeof Colors)['dark'] }) {
  return (
    <View
      style={[
        styles.messageBanner,
        { backgroundColor: ok ? colors.success + '20' : '#FF4D4F20' },
      ]}
    >
      <ThemedText style={{ color: ok ? colors.success : '#FF4D4F', fontSize: 14 }}>
        {text}
      </ThemedText>
    </View>
  );
}

function PrimaryButton({
  label, loading, onPress, colors, btnH,
}: {
  label: string; loading: boolean; onPress: () => void;
  colors: (typeof Colors)['dark']; btnH: number;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.primaryBtn,
        { backgroundColor: colors.primary, height: btnH },
        loading && styles.btnDisabled,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <ThemedText style={styles.primaryBtnText}>{label}</ThemedText>
      )}
    </TouchableOpacity>
  );
}

function FormField({
  label, placeholder, value, onChangeText, colors, editable = true,
  hint, autoCapitalize, keyboardType, inputH, bodyFs,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; colors: (typeof Colors)['dark'];
  editable?: boolean; hint?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'url';
  inputH: number; bodyFs: number;
}) {
  return (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <View
        style={[
          styles.inputWrapper,
          { height: inputH, borderColor: editable ? colors.border : colors.border + '60' },
          !editable && { backgroundColor: colors.border + '20' },
        ]}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          style={[styles.input, { color: editable ? colors.text : '#A0AEC0', fontSize: bodyFs }]}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoCorrect={false}
          keyboardType={keyboardType ?? 'default'}
        />
      </View>
      {hint && <ThemedText style={styles.inputHint}>{hint}</ThemedText>}
    </View>
  );
}

function PasswordField({
  label, placeholder, value, onChangeText, show, onToggle, colors, inputH, bodyFs,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void;
  show: boolean; onToggle: () => void;
  colors: (typeof Colors)['dark']; inputH: number; bodyFs: number;
}) {
  return (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <View style={[styles.inputWrapper, { height: inputH, borderColor: colors.border }]}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          style={[styles.input, { color: colors.text, fontSize: bodyFs }]}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
        />
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
          <IconSymbol size={18} name={show ? 'eye.slash.fill' : 'eye.fill'} color="#A0AEC0" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PersonalInfoScreen() {
  const router      = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors      = Colors[colorScheme];
  const { tab: tabParam } = useLocalSearchParams<{ tab?: TabKey }>();
  const initialTab: TabKey =
    tabParam && ['view', 'edit', 'avatar', 'password', 'notifications'].includes(tabParam)
      ? tabParam
      : 'view';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const r = useResponsive();

  // Reactive auth user — refreshUser() causes immediate UI update without F5
  const { user, refreshUser } = useAuthUser();

  // Stable callback passed to EditProfile / ChangeAvatar
  const handleSaved = useCallback(() => {
    refreshUser();
  }, [refreshUser]);

  // On wide screens tabs fit in the bar without scrolling
  const tabBarScrollable = !r.isWide;

  const renderContent = () => {
    switch (activeTab) {
      case 'view':          return <ViewProfile          colors={colors} user={user} />;
      case 'edit':          return <EditProfile          colors={colors} user={user} onSaved={handleSaved} />;
      case 'avatar':        return <ChangeAvatar         colors={colors} user={user} onSaved={handleSaved} />;
      case 'password':      return <ChangePassword       colors={colors} />;
      case 'notifications': return <NotificationSettings colors={colors} />;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.border, paddingHorizontal: r.hPad },
          ]}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.left" color={colors.primary} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { fontSize: r.headerFs }]}>
            Thông tin cá nhân
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Tab bar ── */}
        {tabBarScrollable ? (
          /* Phones / narrow: horizontal scroll */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.tabBar, { borderBottomColor: colors.border }]}
            contentContainerStyle={[styles.tabBarContent, { paddingHorizontal: r.hPad }]}
          >
            {TABS.map(tab => <TabItem key={tab.key} tab={tab} activeTab={activeTab}
              onPress={setActiveTab} colors={colors} fs={r.tabLabelFs} />)}
          </ScrollView>
        ) : (
          /* Wide: row that spreads evenly */
          <View
            style={[
              styles.tabBar,
              styles.tabBarWide,
              { borderBottomColor: colors.border, paddingHorizontal: r.hPad },
            ]}
          >
            {TABS.map(tab => (
              <View key={tab.key} style={{ flex: 1, alignItems: 'center' }}>
                <TabItem tab={tab} activeTab={activeTab}
                  onPress={setActiveTab} colors={colors} fs={r.tabLabelFs} />
              </View>
            ))}
          </View>
        )}

        {/* ── Content ── */}
        <View style={{ flex: 1 }}>{renderContent()}</View>
      </SafeAreaView>
    </ThemedView>
  );
}

function TabItem({
  tab, activeTab, onPress, colors, fs,
}: {
  tab: Tab; activeTab: TabKey;
  onPress: (k: TabKey) => void;
  colors: (typeof Colors)['dark']; fs: number;
}) {
  const isActive = activeTab === tab.key;
  return (
    <TouchableOpacity
      style={[
        styles.tabItem,
        isActive && [styles.tabItemActive, { borderBottomColor: colors.primary }],
      ]}
      onPress={() => onPress(tab.key)}
    >
      <IconSymbol size={14} name={tab.icon as any} color={isActive ? colors.primary : '#A0AEC0'} />
      <ThemedText
        style={[
          styles.tabLabel,
          { color: isActive ? colors.primary : '#A0AEC0', fontSize: fs },
          isActive && styles.tabLabelActive,
        ]}
      >
        {tab.label}
      </ThemedText>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontWeight: '700' },

  // Tab bar
  tabBar:       { flexGrow: 0, borderBottomWidth: 1 },
  tabBarWide:   { flexDirection: 'row' },
  tabBarContent:{ /* paddingHorizontal set inline */ },
  tabItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    gap: 6, marginRight: 4,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomWidth: 2 },
  tabLabel:      { fontWeight: '500' },
  tabLabelActive:{ fontWeight: '700' },

  // Scroll containers — centred column
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  innerColumn:   { width: '100%' },

  // Section headings
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  sectionDesc:  { lineHeight: 18, marginBottom: 20 },

  // Banner
  messageBanner: {
    padding: 12, borderRadius: 10, marginBottom: 16, alignItems: 'center',
  },

  // Avatar (view profile)
  avatarBlock: {
    alignItems: 'center', marginBottom: 24, position: 'relative',
  },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  onlineDot: {
    width: 16, height: 16, borderRadius: 8,
    position: 'absolute', bottom: 4, right: '35%',
    borderWidth: 2, borderColor: 'white',
  },

  // Info card
  infoCard: {
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 16, marginBottom: 16, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12,
  },
  infoIconWrap: {
    width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  infoTextGroup: { flex: 1 },
  infoLabel:  { fontSize: 11, color: '#A0AEC0', fontWeight: '600', letterSpacing: 0.5 },
  infoValue:  { fontWeight: '500', marginTop: 2 },

  // Badge
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8, gap: 6, marginTop: 8,
  },
  badgeText: { fontSize: 13, fontWeight: '600' },

  // Avatar preview (change avatar tab)
  avatarPreviewWrap: {
    alignItems: 'center', marginBottom: 28, position: 'relative',
  },
  previewBadge: {
    position: 'absolute', bottom: -10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1,
  },

  // Form inputs
  inputGroup:   { marginBottom: 20 },
  inputLabel:   {
    fontSize: 11, fontWeight: '700',
    color: '#A0AEC0', letterSpacing: 1, marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1.5, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.02)',
  },
  input:    { flex: 1, height: '100%' },
  eyeBtn:   { marginLeft: 8, padding: 4 },
  inputHint:{ fontSize: 12, color: '#A0AEC0', marginTop: 6 },

  // Buttons
  primaryBtn: {
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  btnDisabled:    { opacity: 0.6 },
  outlineBtn: {
    borderRadius: 12, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12,
  },
  outlineBtnText: { fontWeight: '600' },

  // Notification rows
  notifRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12,
  },
  notifTextGroup: { flex: 1 },
  notifLabel:     { fontWeight: '600' },
  notifDesc:      { fontSize: 12, marginTop: 2 },
});
