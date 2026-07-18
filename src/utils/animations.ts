import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';

// Screen transition for tabs
export const useScreenTransition = () => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.98);

  useFocusEffect(
    useCallback(() => {
      opacity.value = withTiming(1, { duration: 250, easing: Easing.inOut(Easing.ease) });
      scale.value = withTiming(1, { duration: 250, easing: Easing.inOut(Easing.ease) });
      
      return () => {
        opacity.value = 0;
        scale.value = 0.98;
      };
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    flex: 1, // ensure it fills SafeAreaView
  }));

  return animatedStyle;
};

// Custom entrance animation for cards (translates exactly 10px up instead of default 25px)
export const CustomCardEntrance = (delayMs: number = 0) => {
  return FadeInUp.delay(delayMs)
    .duration(400)
    .easing(Easing.out(Easing.exp))
    .withInitialValues({
      transform: [{ translateY: 10 }], // only 10px
    });
};
