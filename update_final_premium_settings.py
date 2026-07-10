import re

# 1. settings.tsx
content_settings = """import React from 'react';
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

          <Animated.Text entering={FadeInUp.delay(100).springify()} style={[styles.sectionTitle, { marginTop: 10 }]}>
            Timer Configuration
          </Animated.Text>
          
          <Animated.View entering={FadeInUp.delay(150).springify()}>
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
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <SliderCard
              icon="coffee-outline"
              title="Short Break"
              value={settings.shortBreakTime}
              min={1}
              max={30}
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
              max={60}
              step={5}
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
    top: -150,
    right: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: PRIMARY_BLUE,
    opacity: 0.04, // Extremely subtle radial glow
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
    fontSize: 20, // Less visual weight
    fontWeight: '500', // Less visual weight
    color: '#A8C7FF',
    marginBottom: 16,
    marginTop: 32, // More vertical spacing
    letterSpacing: 0.5,
  }
});
"""
with open("app/(tabs)/settings.tsx", "w") as f:
    f.write(content_settings)

# 2. SettingCard.tsx
content_setting_card = """import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { haptics } from '@/src/utils/haptics';

const PRIMARY_BLUE = '#1E90FF';

interface SettingCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  onPress?: () => void;
  rightText?: string;
  hideArrow?: boolean;
}

export default function SettingCard({
  icon,
  title,
  isSwitch = false,
  switchValue = false,
  onSwitchChange,
  onPress,
  rightText,
  hideArrow = false,
}: SettingCardProps) {

  return (
    <TouchableOpacity
      activeOpacity={isSwitch ? 1 : 0.7}
      onPress={() => {
        if (!isSwitch && onPress) {
          haptics.lightTap();
          onPress();
        }
      }}
      style={styles.card}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={22} color={PRIMARY_BLUE} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {title}
        </Text>
      </View>
      
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={(val) => {
            haptics.selection();
            if (onSwitchChange) onSwitchChange(val);
          }}
          trackColor={{ false: '#020B2E', true: PRIMARY_BLUE }}
          thumbColor="#FFFFFF"
        />
      ) : rightText ? (
        <Text style={styles.rightText}>
          {rightText}
        </Text>
      ) : !hideArrow ? (
        <MaterialCommunityIcons name="chevron-right" size={24} color="#5A8CFF" style={styles.chevron} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 72, // Enforce thin 72px rows
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(90, 170, 255, 0.15)', // Delicate glass border
    backgroundColor: 'rgba(18, 32, 78, 0.55)', // Elegant dark glass base
    marginBottom: 16,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, // Extremely soft shadow
    shadowRadius: 10,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'transparent', // Removed inner dark rectangle
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '500', // Medium weight
    fontSize: 18, // Clean elegant sizing
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  rightText: {
    fontWeight: '400',
    fontSize: 16,
    color: '#A8C7FF',
  },
  chevron: {
    opacity: 0.6, // Blend the chevron softly
  }
});
"""
with open("src/components/settings/SettingCard.tsx", "w") as f:
    f.write(content_setting_card)

# 3. SliderCard.tsx
content_slider_card = """import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { haptics } from '@/src/utils/haptics';

const PRIMARY_BLUE = '#1E90FF';

interface SliderCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onValueChange: (val: number) => void;
}

export default function SliderCard({
  icon,
  title,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onValueChange,
}: SliderCardProps) {

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon} size={22} color={PRIMARY_BLUE} />
          </View>
          <Text style={styles.title}>
            {title}
          </Text>
        </View>
        <Text style={styles.valueText}>
          {value}{unit}
        </Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          onValueChange={(val) => {
            onValueChange(val);
          }}
          onSlidingComplete={() => {
            haptics.selection();
          }}
          minimumTrackTintColor={PRIMARY_BLUE}
          maximumTrackTintColor="rgba(2, 11, 46, 0.8)" // Dark navy track
          thumbTintColor="#FFFFFF" // Clean white thumb
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(90, 170, 255, 0.15)', // Delicate glass border
    backgroundColor: 'rgba(18, 32, 78, 0.55)', // Elegant dark glass base
    marginBottom: 16,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, // Extremely soft shadow
    shadowRadius: 10,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'transparent', // Removed inner dark rectangle
  },
  title: {
    fontWeight: '500', // Medium weight
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  valueText: {
    fontWeight: '400',
    fontSize: 18,
    color: PRIMARY_BLUE, // Blue but not glowing
  },
  sliderContainer: {
    width: '100%',
  },
  slider: {
    width: '100%',
    height: 36, // Slender slider
  },
});
"""
with open("src/components/settings/SliderCard.tsx", "w") as f:
    f.write(content_slider_card)

