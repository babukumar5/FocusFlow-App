import React, { useEffect } from 'react';
import { TextInput, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  style?: TextStyle | TextStyle[];
  duration?: number;
  formatAs?: 'integer' | 'decimal';
}

export default function AnimatedNumber({
  value,
  style,
  duration = 1000,
  formatAs = 'integer',
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration]);

  const animatedProps = useAnimatedProps(() => {
    let formattedText = '';
    if (formatAs === 'decimal') {
      // Need to make sure it keeps 1 decimal place if we want 10.0, but standard Math.round doesn't enforce .0
      // Reanimated works best with pure JS Math operations in worklets
      const rounded = Math.round(animatedValue.value * 10) / 10;
      // manual simple formatting to ensure 1 decimal for decimal format
      formattedText = rounded % 1 === 0 ? rounded + '.0' : rounded.toString();
    } else {
      formattedText = Math.round(animatedValue.value).toString();
    }

    return {
      text: formattedText,
      defaultValue: formattedText,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      animatedProps={animatedProps}
      style={[styles.text, style]}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    padding: 0,
    margin: 0,
  },
});
