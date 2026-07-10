import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const haptics = {
  lightTap: () => {
    if (isWeb) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  mediumTap: () => {
    if (isWeb) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavyTap: () => {
    if (isWeb) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success: () => {
    if (isWeb) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    if (isWeb) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error: () => {
    if (isWeb) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  selection: () => {
    if (isWeb) return;
    Haptics.selectionAsync();
  }
};
