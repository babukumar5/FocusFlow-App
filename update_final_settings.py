import re

# 1. settings.tsx
content_settings = """import React, { useEffect } from 'react';
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
      {/* Background Radial Glow */}
      <View style={styles.glowTopRight} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <View>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Customize your FocusFlow experience.</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton}>
              <MaterialCommunityIcons name="cog" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(100).springify()} style={styles.sectionTitle}>
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
              icon="coffee"
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
              icon="coffee-outline"
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
              icon="update"
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
              icon="bell-ring"
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
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: PRIMARY_BLUE,
    opacity: 0.12,
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
    backgroundColor: '#020B2E',
    borderWidth: 2,
    borderColor: PRIMARY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
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
        <MaterialCommunityIcons name="chevron-right" size={24} color="#A8C7FF" />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 18,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    fontSize: 20,
    color: '#FFFFFF',
  },
  rightText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#A8C7FF',
  },
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
          maximumTrackTintColor="#020B2E"
          thumbTintColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    paddingBottom: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 18,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  title: {
    fontWeight: '600',
    fontSize: 20,
    color: '#FFFFFF',
  },
  valueText: {
    fontWeight: '700',
    fontSize: 20,
    color: PRIMARY_BLUE,
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
"""
with open("src/components/settings/SliderCard.tsx", "w") as f:
    f.write(content_slider_card)

