import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettingsStore } from '@/src/store/settingsStore';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { settings } = useSettingsStore();


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Run branding entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Route to tabs after animation completes
    const checkRedirect = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);

    return () => clearTimeout(checkRedirect);
  }, []);

  return (
    <LinearGradient
      colors={
        settings.theme === 'light'
          ? ['#FFFFFF', '#E8F5E9']
          : ['#121212', '#1E1E1E']
      }
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name="timer-sand" size={64} color={theme.colors.primary} />
        </View>
        <Text style={[styles.appName, { color: theme.colors.onSurface, ...theme.fonts.displayMedium }]}>
          FocusFlow
        </Text>
        <Text style={[styles.tagline, { color: theme.colors.onSurfaceVariant, ...theme.fonts.bodyLarge }]}>
          Master your time, achieve your goals.
        </Text>
      </Animated.View>

      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  appName: {
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    opacity: 0.8,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 80,
  },
});
