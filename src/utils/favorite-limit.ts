import { Alert, Platform } from 'react-native';

const TITLE = 'Đã đạt giới hạn yêu thích';
const MESSAGE =
  'Tài khoản thường chỉ được yêu thích tối đa 3 cầu thủ. Bạn phải mua gói VIP Football Star để yêu thích không giới hạn.';

export function showFavoriteLimitPrompt(openVipPage: () => void) {
  if (Platform.OS === 'web') {
    window.alert(`${TITLE}\n\n${MESSAGE}`);
    openVipPage();
    return;
  }

  Alert.alert(
    TITLE,
    MESSAGE,
    [{ text: 'Xem gói VIP', onPress: openVipPage }],
    { cancelable: false },
  );
}
