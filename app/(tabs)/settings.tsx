import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTimerStore } from '@/src/store/timerStore';
import { useScreenTransition, CustomCardEntrance } from '@/src/utils/animations';

import SettingCard from '@/src/components/settings/SettingCard';
import SliderCard from '@/src/components/settings/SliderCard';

const PRIMARY_BLUE = '#1E90FF';

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettingsStore();
  const { updateSettings: updateAuthSettings } = useAuthStore();
  const { setDurations } = useTimerStore();

  const handleUpdate = (updates: Partial<typeof settings>) => {
    updateSettings(updates);
    updateAuthSettings(updates);
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Timer Settings?",
      "This will restore the default timer settings.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: () => handleUpdate({ focusTime: 25, shortBreakTime: 5, cycles: 2 })
        }
      ]
    );
  };

  const screenStyle = useScreenTransition();

  return (
    <ExpoLinearGradient colors={['#020B2E', '#0A2F73']} style={styles.gradientBg}>
      {/* Very subtle radial glow */}
      <View style={styles.glowTopRight} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View style={screenStyle}>
          <Animated.View entering={FadeIn.duration(600)} style={[styles.header, { justifyContent: 'center' }]}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.title, { textAlign: 'center' }]}>Settings</Text>
              <Text style={[styles.subtitle, { textAlign: 'center' }]}>Customize your FocusFlow experience.</Text>
            </View>
          </Animated.View>

          <Animated.Text entering={CustomCardEntrance(100)} style={[styles.sectionTitle, { marginTop: 16 }]}>
            Timer Configuration
          </Animated.Text>
          
          <Animated.View entering={CustomCardEntrance(150)}>
            <SliderCard
              icon="brain"
              title="Focus Duration"
              value={settings.focusTime}
              min={5}
              max={120}
              step={1}
              unit="m"
              onValueChange={(val) => handleUpdate({ focusTime: val })}
            />
          </Animated.View>

          <Animated.View entering={CustomCardEntrance(200)}>
            <SliderCard
              icon="coffee-outline"
              title="Break"
              value={settings.shortBreakTime}
              min={1}
              max={30}
              step={1}
              unit="m"
              onValueChange={(val) => handleUpdate({ shortBreakTime: val })}
            />
          </Animated.View>

          <Animated.View entering={CustomCardEntrance(250)}>
            <SliderCard
              icon="refresh"
              title="Cycles"
              value={settings.cycles}
              min={1}
              max={10}
              step={1}
              unit=""
              onValueChange={(val) => handleUpdate({ cycles: val })}
            />
          </Animated.View>


          <Animated.View entering={CustomCardEntrance(400)}>
            <SettingCard
              icon="refresh"
              title="Reset Timer"
              hideArrow={true}
              onPress={handleReset}
            />
          </Animated.View>

          <Animated.Text entering={CustomCardEntrance(450)} style={styles.sectionTitle}>
            Support
          </Animated.Text>




          <Animated.View entering={CustomCardEntrance(600)}>
            <SettingCard
              icon="help-circle-outline"
              title="How to Use"
              onPress={() => {}}
            />
          </Animated.View>

          <Animated.View entering={CustomCardEntrance(650)}>
            <SettingCard
              icon="email-outline"
              title="Write Us"
              onPress={() => {}}
            />
          </Animated.View>

          <Animated.View entering={CustomCardEntrance(700)}>
            <SettingCard
              icon="star-outline"
              title="Rate Us"
              onPress={() => {}}
            />
          </Animated.View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  glowTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: PRIMARY_BLUE,
    opacity: 0.015, // Extremely subtle radial glow
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 48, // More spacing below header
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#A8C7FF',
    lineHeight: 22,
    fontFamily: 'System',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
    marginTop: 36, // More vertical spacing
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingLeft: 8,
  }
});
