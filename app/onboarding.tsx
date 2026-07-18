import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { createUser } from '@/src/services/db';
import { useAuthStore } from '@/src/store/authStore';
import { AnimatedPressable } from '@/src/components/common/AnimatedPressable';

const PRIMARY_BLUE = '#1E90FF';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  
  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      if (!username.trim()) return;
      // Save user to SQLite
      createUser(username.trim());
      // Force hydrate auth store to reload user
      useAuthStore.getState().hydrate();
      // Navigate to Home
      router.replace('/(tabs)');
    }
  };

  return (
    <ExpoLinearGradient colors={['#020B2E', '#0A2F73']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {step === 1 ? (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Terms & Conditions</Text>
              <Text style={styles.text}>
                By using FocusFlow, you agree to our Terms and Conditions. This app is 100% offline and respects your privacy. All your data is stored securely and locally on your device.
              </Text>
            </View>
          ) : (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Welcome to FocusFlow</Text>
              <Text style={styles.text}>What should we call you?</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={username}
                onChangeText={setUsername}
                autoFocus
                maxLength={20}
              />
            </View>
          )}

          <AnimatedPressable 
            style={[styles.button, (step === 2 && !username.trim()) && styles.buttonDisabled]} 
            onPress={handleNext}
            disabled={step === 2 && !username.trim()}
          >
            <Text style={styles.buttonText}>{step === 1 ? 'I Agree' : 'Get Started'}</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    paddingBottom: 48,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#A8C7FF',
    lineHeight: 24,
    marginBottom: 32,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 18,
  },
  button: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  }
});
