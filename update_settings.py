import re

content = """import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
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
    
    // Update active timer durations immediately if they change
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
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Customize your focus experience.</Text>
            </View>
            <View style={styles.settingsButton}>
              <MaterialCommunityIcons name="cog" size={24} color="#FFFFFF" />
            </View>
          </View>

          {/* Section 1: Timer Configuration */}
          <Text style={styles.sectionTitle}>Timer Configuration</Text>
          
          <SliderCard
            icon="brain"
            title="Focus Duration"
            value={settings.focusTime}
            min={5}
            max={120}
            step={5}
            unit="m"
            onValueChange={(val) => handleUpdate({ focusTime: val })}
          />
          <SliderCard
            icon="coffee"
            title="Short Break"
            value={settings.shortBreakTime}
            min={1}
            max={30}
            step={1}
            unit="m"
            onValueChange={(val) => handleUpdate({ shortBreakTime: val })}
          />
          <SliderCard
            icon="coffee-outline"
            title="Long Break"
            value={settings.longBreakTime}
            min={5}
            max={60}
            step={5}
            unit="m"
            onValueChange={(val) => handleUpdate({ longBreakTime: val })}
          />
          <SliderCard
            icon="update"
            title="Cycles"
            value={settings.cycles}
            min={1}
            max={10}
            step={1}
            unit=""
            onValueChange={(val) => handleUpdate({ cycles: val })}
          />

          {/* Section 2: Preferences */}
          <Text style={styles.sectionTitle}>Preferences</Text>

          <SettingCard
            icon="bell-ring"
            title="Timer Sound"
            isSwitch
            switchValue={settings.timerSoundEnabled}
            onSwitchChange={(val) => handleUpdate({ timerSoundEnabled: val })}
          />
          <SettingCard
            icon="bell-outline"
            title="Notifications"
            isSwitch
            switchValue={settings.notifications}
            onSwitchChange={(val) => handleUpdate({ notifications: val })}
          />
          <SettingCard
            icon="brightness-4"
            title="AMOLED Mode"
            isSwitch
            switchValue={settings.theme === 'amoled'}
            onSwitchChange={(val) => handleUpdate({ theme: val ? 'amoled' : 'dark' })}
          />

          {/* Section 3: Connect & Support */}
          <Text style={styles.sectionTitle}>Connect & Support</Text>
          
          <SettingCard
            icon="email-outline"
            title="Contact Us"
            onPress={() => Linking.openURL('mailto:support@focusflow.com').catch(() => {})}
          />
          <SettingCard
            icon="help-circle-outline"
            title="What is Pomodoro?"
            onPress={() => {}}
          />
          <SettingCard
            icon="star-outline"
            title="Rate This App"
            onPress={() => {}}
          />
          <SettingCard
            icon="share-variant-outline"
            title="Share App"
            onPress={() => {}}
          />

        </ScrollView>
      </SafeAreaView>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140, // Extra padding for floating tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
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
    backgroundColor: '#1E90FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 16,
  }
});
"""

with open("app/(tabs)/settings.tsx", "w") as f:
    f.write(content)
