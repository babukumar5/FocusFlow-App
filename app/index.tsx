import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeOut,
  withTiming, 
  withRepeat, 
  withSequence, 
  useSharedValue, 
  useAnimatedStyle,
  Easing
} from 'react-native-reanimated';
import { Svg, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const PRIMARY_BLUE = '#1E90FF'; 
const LIGHT_BLUE = '#A8C7FF';

export default function AppSplashScreen() {
  const router = useRouter();
  
  const glowOpacity = useSharedValue(0.15);
  const ringScale = useSharedValue(0.98);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Subtle breathing glow animation for the ring
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.98, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Show splash for ~900ms, then trigger fade out
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      // Wait for fade out animation to finish before replacing route
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500); // 500ms fade out duration
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: ringScale.value }],
    shadowOpacity: glowOpacity.value * 0.8,
  }));

  const particles = [
    { top: height * 0.2, left: width * 0.25, size: 3, opacity: 0.6 },
    { top: height * 0.18, right: width * 0.22, size: 4, opacity: 0.8 },
    { top: height * 0.35, left: width * 0.12, size: 2, opacity: 0.4 },
    { top: height * 0.28, right: width * 0.15, size: 3, opacity: 0.5 },
    { top: height * 0.45, right: width * 0.25, size: 2, opacity: 0.7 },
    { top: height * 0.48, left: width * 0.18, size: 4, opacity: 0.5 },
    { top: height * 0.38, right: width * 0.08, size: 2, opacity: 0.4 },
    { top: height * 0.12, left: width * 0.4, size: 3, opacity: 0.6 },
    { top: height * 0.14, right: width * 0.38, size: 2, opacity: 0.5 },
  ];

  if (isFadingOut) {
    return (
      <Animated.View exiting={FadeOut.duration(500)} style={styles.container}>
        <SplashScreenContent animatedGlowStyle={animatedGlowStyle} particles={particles} />
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <SplashScreenContent animatedGlowStyle={animatedGlowStyle} particles={particles} />
    </Animated.View>
  );
}

function SplashScreenContent({ animatedGlowStyle, particles }: any) {
  return (
    <ExpoLinearGradient colors={['#020B2E', '#040C24', '#061743']} style={styles.container}>
      {/* Background Particles */}
      {particles.map((p: any, i: number) => (
        <View 
          key={i} 
          style={[
            styles.particle, 
            { 
              top: p.top, 
              ...(p.left ? { left: p.left } : { right: p.right }), 
              width: p.size, 
              height: p.size, 
              opacity: p.opacity 
            }
          ]} 
        />
      ))}

      {/* Center Content */}
      <View style={styles.content}>
        
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

      </View>

      {/* Bottom Waves */}
      <View style={styles.waveContainer}>
        {/* Back Wave */}
        <Svg height="100%" width="100%" viewBox="0 0 1440 320" preserveAspectRatio="none" style={styles.wave1}>
          <Defs>
            <SvgLinearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#0044CC" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#007AFF" stopOpacity="0.4" />
            </SvgLinearGradient>
          </Defs>
          <Path
            fill="url(#wave1)"
            d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </Svg>
        {/* Front Wave */}
        <Svg height="100%" width="100%" viewBox="0 0 1440 320" preserveAspectRatio="none" style={styles.wave2}>
          <Defs>
            <SvgLinearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#0022AA" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#00E5FF" stopOpacity="0.5" />
            </SvgLinearGradient>
          </Defs>
          <Path
            fill="url(#wave2)"
            d="M0,128L60,149.3C120,171,240,213,360,208C480,203,600,149,720,144C840,139,960,181,1080,181.3C1200,181,1320,139,1380,117.3L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
        </Svg>
      </View>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#020B2E',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#00E5FF',
    borderRadius: 50,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    marginTop: -80, // offset up to make room for waves
  },
  logoWrapper: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  glowingRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 162, 255, 0.7)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
  },
  logoImage: {
    width: 130,
    height: 130,
  },
  textWrapper: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 44,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  appNameHighlight: {
    color: PRIMARY_BLUE,
  },
  tagline: {
    fontSize: 16,
    color: '#8BA6D1',
    fontFamily: 'System',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.28, 
  },
  wave1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  wave2: {
    position: 'absolute',
    bottom: -10, // shifted slightly down
    left: 0,
    right: 0,
  },
});
