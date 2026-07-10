import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTimerStore } from '@/src/store/timerStore';

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
    
    // Sync timer durations — setDurations only applies when timer is idle
    if (updates.focusTime !== undefined || updates.shortBreakTime !== undefined || updates.longBreakTime !== undefined) {
       setDurations(
         updates.focusTime ?? settings.focusTime,
         updates.shortBreakTime ?? settings.shortBreakTime,
         updates.longBreakTime ?? settings.longBreakTime
       );
    }
  };

  return (
    <ExpoLinearGradient colors={['#020B2E', '#0A2F73']} style={styles.gradientBg}>
      {/* Very subtle radial glow */}
      <View style={styles.glowTopRight} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <View>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Customize your FocusFlow experience.</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton}>
              <MaterialCommunityIcons name="cog-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(100).springify()} style={[styles.sectionTitle, { marginTop: 16 }]}>
            Timer Configuration
          </Animated.Text>
          
          <Animated.View entering={FadeInUp.delay(150).springify()}>
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

          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <SliderCard
              icon="coffee-outline"
              title="Short Break"
              value={settings.shortBreakTime}
              min={1}
              max={15}
              step={1}
              unit="m"
              onValueChange={(val) => handleUpdate({ shortBreakTime: val })}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(250).springify()}>
            <SliderCard
              icon="cup-outline"
              title="Long Break"
              value={settings.longBreakTime}
              min={5}
              max={30}
              step={1}
              unit="m"
              onValueChange={(val) => handleUpdate({ longBreakTime: val })}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).springify()}>
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

          <Animated.Text entering={FadeInUp.delay(350).springify()} style={styles.sectionTitle}>
            Preferences
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(400).springify()}>
            <SettingCard
              icon="bell-ring-outline"
              title="Timer Sound"
              isSwitch
              switchValue={settings.timerSoundEnabled}
              onSwitchChange={(val) => handleUpdate({ timerSoundEnabled: val })}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(450).springify()}>
            <SettingCard
              icon="bell-outline"
              title="Notifications"
              isSwitch
              switchValue={settings.notifications}
              onSwitchChange={(val) => handleUpdate({ notifications: val })}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).springify()}>
            <SettingCard
              icon="brightness-4"
              title="AMOLED Mode"
              isSwitch
              switchValue={settings.theme === 'amoled'}
              onSwitchChange={(val) => handleUpdate({ theme: val ? 'amoled' : 'dark' })}
            />
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(550).springify()} style={styles.sectionTitle}>
            Connect & Support
          </Animated.Text>
          
          <Animated.View entering={FadeInUp.delay(600).springify()}>
            <SettingCard
              icon="email-outline"
              title="Contact Us"
              onPress={() => Linking.openURL('mailto:support@focusflow.com').catch(() => {})}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(650).springify()}>
            <SettingCard
              icon="help-circle-outline"
              title="What is Pomodoro?"
              onPress={() => {}}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(700).springify()}>
            <SettingCard
              icon="star-outline"
              title="Rate This App"
              onPress={() => {}}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(750).springify()}>
            <SettingCard
              icon="share-variant-outline"
              title="Share App"
              onPress={() => {}}
            />
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 144, 255, 0.1)', // Very subtle glass button
    borderWidth: 1,
    borderColor: 'rgba(90, 170, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, // Reduced glow
    shadowRadius: 6,
    elevation: 2,
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
