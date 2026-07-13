import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { ThemedText } from './themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export const REACTIONS = ['❤️', '😍', '🔥', '😂', '👏'];

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  selectedEmoji?: string;
}

export function ReactionPicker({ visible, onClose, onSelect, selectedEmoji }: ReactionPickerProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const scaleValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
      }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <Animated.View style={[styles.pickerBox, { backgroundColor: colors.card, transform: [{ scale: scaleValue }] }]}>
            {REACTIONS.map((emoji) => {
              const isSelected = selectedEmoji === emoji;
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiBtn, isSelected && { backgroundColor: colors.primary + '30' }]}
                  onPress={() => onSelect(emoji)}
                >
                  <ThemedText style={styles.emojiTxt}>{emoji}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  pickerBox: {
    flexDirection: 'row',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    gap: 8,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiTxt: {
    fontSize: 24,
  },
});
