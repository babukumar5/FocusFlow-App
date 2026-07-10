import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  AppState,
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
} from 'react-native-reanimated';
import { useTimerStore } from '@/src/store/timerStore';
import { useShallow } from 'zustand/react/shallow';
import { formatTime } from '@/src/utils/formatTime';
import { haptics } from '@/src/utils/haptics';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TimerHomeScreen() {
  const {
    status,
    remainingTime,
    totalDuration,
    start,
    pause,
    resume,
    reset,
    syncBackgroundTime,
  } = useTimerStore(
    useShallow((state) => ({
      status: state.status,
      remainingTime: state.remainingTime,
      totalDuration: state.totalDuration,
      start: state.start,
      pause: state.pause,
      resume: state.resume,
      reset: state.reset,
      syncBackgroundTime: state.syncBackgroundTime,
    }))
  );

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

  useEffect(() => {
    progressVal.value = withTiming(remainingTime / totalDuration, {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [remainingTime, totalDuration]);

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

  return (
    <LinearGradient
      colors={['#1E5BB0', '#071B49']}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
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
              <Text style={styles.countdownNumber}>
                {formatTime(remainingTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {status === 'paused' ? (
            <>
              {/* Reset Control */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  haptics.heavyTap();
                  reset();
                }}
              >
                <View style={styles.btnInner}>
                  <MaterialCommunityIcons name="stop" size={28} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              
              {/* Resume Control */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  haptics.lightTap();
                  resume();
                }}
              >
                <View style={styles.btnInner}>
                  <MaterialCommunityIcons name="play" size={32} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </>
          ) : (
            /* Main Center Control (Play/Pause) */
            <TouchableOpacity
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
              <View style={styles.btnInner}>
                <MaterialCommunityIcons name={status === 'running' ? 'pause' : 'play'} size={32} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
        </View>
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
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
