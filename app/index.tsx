import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  withTiming, 
  withRepeat, 
  withSequence, 
  useSharedValue, 
  useAnimatedStyle,
  Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const PRIMARY_BLUE = '#1E90FF';
const LIGHT_BLUE = '#A8C7FF';

export default function SplashScreen() {
  const router = useRouter();
  
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Soft breathing glow animation for the ring
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Route to tabs after animation completes
    const checkRedirect = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2500);

    return () => clearTimeout(checkRedirect);
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    shadowOpacity: glowOpacity.value * 0.8,
  }));

  return (
    <ExpoLinearGradient colors={['#020B2E', '#0A2F73']} style={styles.container}>
      {/* Background Particles & Soft Glow */}
      <View style={styles.radialGlow} />
      <View style={[styles.particle, { top: height * 0.25, left: width * 0.2, width: 3, height: 3, opacity: 0.4 }]} />
      <View style={[styles.particle, { top: height * 0.35, right: width * 0.15, width: 4, height: 4, opacity: 0.6 }]} />
      <View style={[styles.particle, { top: height * 0.45, left: width * 0.1, width: 2, height: 2, opacity: 0.3 }]} />
      <View style={[styles.particle, { top: height * 0.2, right: width * 0.25, width: 3, height: 3, opacity: 0.5 }]} />
      <View style={[styles.particle, { top: height * 0.55, right: width * 0.2, width: 2, height: 2, opacity: 0.4 }]} />

      <Animated.View entering={FadeIn.duration(1000)} style={styles.content}>
        
        {/* Logo & Glowing Ring */}
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.glowingRing, animatedGlowStyle]} />
          
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
        </View>

        {/* Text Section */}
        <View style={styles.textWrapper}>
          <Text style={styles.appName}>
            Focus<Text style={styles.appNameHighlight}>Flow</Text>
          </Text>
          <Text style={styles.tagline}>Master your time, achieve your goals.</Text>
        </View>

      </Animated.View>

      {/* Loading Indicator */}
      <Animated.View entering={FadeIn.delay(800).duration(800)} style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={PRIMARY_BLUE} />
      </Animated.View>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialGlow: {
    position: 'absolute',
    top: height * 0.5 - 150, // Centered vertically around logo
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: PRIMARY_BLUE,
    opacity: 0.08,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#A8C7FF',
    borderRadius: 50,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8,
  },
  logoWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  glowingRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: 'rgba(90, 170, 255, 0.5)',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    // We intentionally avoid elevation here to prevent solid black shadow boxes on Android
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 24, // Keeps it smooth if the original icon has a background
  },
  textWrapper: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  appNameHighlight: {
    color: PRIMARY_BLUE,
  },
  tagline: {
    fontSize: 16,
    color: LIGHT_BLUE,
    opacity: 0.8,
    fontFamily: 'System',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
