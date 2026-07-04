/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2F80ED';
const tintColorDark = '#2F80ED';

export const Colors = {
  light: {
    text: '#0D1117',
    background: '#F5F7FA',
    tint: tintColorLight,
    icon: '#A0AEC0',
    tabIconDefault: '#A0AEC0',
    tabIconSelected: tintColorLight,
    primary: '#2F80ED',
    success: '#00C853',
    gold: '#FFD54F',
    card: '#FFFFFF',
    border: '#E2E8F0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0D1117',
    tint: tintColorDark,
    icon: '#A0AEC0',
    tabIconDefault: '#A0AEC0',
    tabIconSelected: tintColorDark,
    primary: '#2F80ED',
    success: '#00C853',
    gold: '#FFD54F',
    card: '#161B22',
    border: '#30363D',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
