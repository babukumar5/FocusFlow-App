import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  AppState,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  useFrameCallback,
} from 'react-native-reanimated';
import { useTimerStore } from '@/src/store/timerStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useShallow } from 'zustand/react/shallow';
import { formatTime } from '@/src/utils/formatTime';
import { haptics } from '@/src/utils/haptics';
import { AnimatedPressable } from '@/src/components/common/AnimatedPressable';
import { useScreenTransition } from '@/src/utils/animations';


const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function TimerHomeScreen() {
  const { settings } = useSettingsStore();

  const {
    mode,
    status,
    remainingTime,
    targetEndTime,
    start,
    pause,
    resume,
    reset,
    switchMode,
    syncBackgroundTime,
    completedPomodoros,
  } = useTimerStore(
    useShallow((state) => ({
      mode: state.mode,
      status: state.status,
      remainingTime: state.remainingTime,
      targetEndTime: state.targetEndTime,
      start: state.start,
      pause: state.pause,
      resume: state.resume,
      reset: state.reset,
      switchMode: state.switchMode,
      syncBackgroundTime: state.syncBackgroundTime,
      completedPomodoros: state.completedPomodoros,
    }))
  );

  const totalDuration = mode === 'FOCUS' 
    ? settings.focusTime * 60 
    : (mode === 'BREAK' ? settings.shortBreakTime * 60 : settings.longBreakTime * 60);

  const cycles = settings.cycles;

  let cycleText = '';
  if (completedPomodoros >= cycles) {
    cycleText = `${cycles}/${cycles} • Completed 🎉`;
  } else if (mode === 'BREAK') {
    if (completedPomodoros === cycles - 1) {
      cycleText = `${completedPomodoros}/${cycles} • Final Break`;
    } else {
      cycleText = `${completedPomodoros}/${cycles} • Break Time`;
    }
  } else {
    if (completedPomodoros === 0) {
      cycleText = `0/${cycles} • Start Focus`;
    } else if (completedPomodoros === cycles - 1 && cycles > 2) {
      cycleText = `${completedPomodoros}/${cycles} • One More!`;
    } else {
      cycleText = `${completedPomodoros}/${cycles} • Keep Going!`;
    }
  }

  useEffect(() => {
    const handleAppStateChange = (nextState: string) => {
      if (nextState === 'active') syncBackgroundTime();
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    syncBackgroundTime();
    

    return () => subscription.remove();
  }, []);

  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current === 'running' && status === 'idle' && remainingTime <= 1) {
      haptics.success();
    }
    prevStatusRef.current = status;
  }, [status, remainingTime]);

  const progressVal = useSharedValue(remainingTime / totalDuration);
  const glowVal = useSharedValue(0.1);

  // Flawless high-performance timestamp-based native UI rendering
  useFrameCallback(() => {
    if (status === 'running' && targetEndTime) {
      const now = Date.now();
      const remainingMs = Math.max(0, targetEndTime - now);
      progressVal.value = remainingMs / (totalDuration * 1000);
    } else {
      progressVal.value = remainingTime / totalDuration;
    }
  });

  useEffect(() => {
    glowVal.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const radius = width * 0.38;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progressVal.value);
    return {
      strokeDashoffset,
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    const scaleFactor = status === 'running' ? 1.02 : 1;
    return {
      opacity: glowVal.value,
      transform: [{ scale: withTiming(scaleFactor, { duration: 500 }) }],
    };
  });

  const animatedTextProps = useAnimatedProps(() => {
    // Derive the remaining seconds directly from the smoothly animating progress value.
    // This perfectly insulates the text rendering from JS thread skips/batching.
    const currentRemaining = Math.ceil(progressVal.value * totalDuration);
    const m = Math.floor(currentRemaining / 60);
    const s = currentRemaining % 60;
    const text = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return {
      text: text,
      defaultValue: text,
    } as any;
  });

  const screenStyle = useScreenTransition();

  return (
    <LinearGradient
      colors={['#1E5BB0', '#071B49']}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={screenStyle}>
          {/* Title */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Focus on your task</Text>
        </View>

        {/* Center Timer Ring */}
        <View style={styles.centerSection}>
          <View style={styles.svgContainer}>
            {/* Animated Glow Layer */}
            <Animated.View
              style={[
                styles.glowOverlay,
                { width: radius * 2 + strokeWidth, height: radius * 2 + strokeWidth, borderRadius: radius + strokeWidth / 2 },
                animatedGlowStyle,
              ]}
            />

            <Svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2} viewBox={`0 0 ${radius * 2 + strokeWidth * 2} ${radius * 2 + strokeWidth * 2}`}>
              <Defs>
                <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" />
                  <Stop offset="100%" stopColor="#87CEFA" />
                </SvgLinearGradient>
              </Defs>

              {/* Background Track Circle */}
              <Circle
                cx={radius + strokeWidth}
                cy={radius + strokeWidth}
                r={radius}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth={strokeWidth}
                fill="transparent"
              />

              {/* Foreground Progress Circle */}
              <AnimatedCircle
                cx={radius + strokeWidth}
                cy={radius + strokeWidth}
                r={radius}
                stroke="url(#grad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                animatedProps={animatedProps}
                strokeLinecap="round"
                transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
                fill="transparent"
              />
            </Svg>

            <View style={styles.timeDisplayOverlay}>
              <Text style={styles.cycleIndicatorText}>{cycleText}</Text>
              <AnimatedTextInput
                editable={false}
                animatedProps={animatedTextProps}
                style={[styles.countdownNumber, { padding: 0, margin: 0 }]}
              />
            </View>
          </View>

          {/* Mode Selector */}
          <AnimatedPressable 
            style={styles.modeSelector}
            onPress={() => switchMode(mode === 'FOCUS' ? 'BREAK' : 'FOCUS')}
          >
            <MaterialCommunityIcons name="chevron-down" size={20} color="#FFFFFF" />
            <Text style={styles.modeSelectorText}>
              {mode === 'FOCUS' ? 'POMODORO' : 'BREAK'}{' '}
              <Text style={styles.modeDurationText}>
                {mode === 'FOCUS' ? settings.focusTime : settings.shortBreakTime} MIN
              </Text>
            </Text>
          </AnimatedPressable>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {status === 'paused' ? (
            <>
              {/* Reset Control */}
              <AnimatedPressable
                style={styles.actionBtn}
                onPress={() => {
                  haptics.heavyTap();
                  reset();
                }}
              >
                <MaterialCommunityIcons name="stop" size={28} color="#FFFFFF" />
              </AnimatedPressable>
              
              {/* Resume Control */}
              <AnimatedPressable
                style={styles.actionBtn}
                onPress={() => {
                  haptics.lightTap();
                  resume();
                }}
              >
                <MaterialCommunityIcons name="play" size={32} color="#FFFFFF" />
              </AnimatedPressable>
            </>
          ) : (
            /* Main Center Control (Play/Pause) */
            <AnimatedPressable
              style={styles.actionBtn}
              onPress={() => {
                haptics.lightTap();
                if (status === 'running') {
                  pause();
                } else {
                  start();
                }
              }}
            >
              <MaterialCommunityIcons name={status === 'running' ? 'pause' : 'play'} size={32} color="#FFFFFF" />
            </AnimatedPressable>
          )}
        </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    shadowColor: '#87CEFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 8,
  },
  timeDisplayOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleIndicatorText: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
    width: 200,
    textAlign: 'center',
  },
  countdownNumber: {
    fontSize: 72,
    color: '#FFFFFF',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.5,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginBottom: 100,
  },
  actionBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    backgroundColor: 'transparent',
  },
  modeSelectorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 4,
  },
  modeDurationText: {
    color: '#87CEFA',
  },
});
