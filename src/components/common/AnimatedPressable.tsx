import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  onPressIn,
  onPressOut,
  style,
  children,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = (e: any) => {
    scale.value = withTiming(0.98, { duration: 100, easing: Easing.out(Easing.ease) });
    opacity.value = withTiming(0.95, { duration: 100, easing: Easing.out(Easing.ease) });
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
    opacity.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
    if (onPressOut) onPressOut(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Platform.OS android_ripple is specifically disabled or omitted to prevent harsh overlay
  return (
    <AnimatedPress
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      android_ripple={null}
      {...rest}
    >
      {children}
    </AnimatedPress>
  );
};
