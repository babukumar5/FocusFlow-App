import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTimerStore } from '@/src/store/timerStore';
import { useScreenTransition, CustomCardEntrance } from '@/src/utils/animations';
import { AnimatedPressable } from '@/src/components/common/AnimatedPressable';

import SettingCard from '@/src/components/settings/SettingCard';
import SliderCard from '@/src/components/settings/SliderCard';

const PRIMARY_BLUE = '#1E90FF';

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettingsStore();
  const { updateSettings: updateAuthSettings } = useAuthStore();
  const { setDurations } = useTimerStore();

  const [isHowToUseVisible, setIsHowToUseVisible] = useState(false);
  const [isRateUsVisible, setIsRateUsVisible] = useState(false);

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

  const handleWriteUs = () => {
    const email = "focusflow5.app@gmail.com";
    const subject = "FocusFlow Feedback";
    const body = `Hello FocusFlow Team,

Type: Bug Report / Feature Request / Feedback

Message:


Device: 
Android Version: 
App Version: `;
    
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`).catch(() => {
      Alert.alert("Error", "Could not open email client.");
    });
  };

  const screenStyle = useScreenTransition();

  const InstructionCard = ({ icon, title, description, isTip = false, delay = 0 }: { icon: string, title: string, description: string, isTip?: boolean, delay?: number }) => (
    <Animated.View entering={FadeInUp.delay(delay).springify()}>
      <ExpoLinearGradient
        colors={isTip ? ['rgba(255, 215, 0, 0.08)', 'rgba(255, 215, 0, 0.02)'] : ['rgba(30, 144, 255, 0.08)', 'rgba(30, 144, 255, 0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.instructionCard, isTip && styles.instructionCardTip]}
      >
        <View style={[styles.instructionIconWrapper, isTip && styles.instructionIconWrapperTip]}>
          <Text style={styles.instructionIcon}>{icon}</Text>
        </View>
        <View style={styles.instructionTextContainer}>
          <Text style={[styles.instructionTitle, isTip && styles.instructionTitleTip]}>{title}</Text>
          <Text style={styles.instructionDescription}>{description}</Text>
        </View>
      </ExpoLinearGradient>
    </Animated.View>
  );

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
              onPress={() => setIsHowToUseVisible(true)}
            />
          </Animated.View>

          <Animated.View entering={CustomCardEntrance(650)}>
            <SettingCard
              icon="email-outline"
              title="Write Us"
              onPress={handleWriteUs}
            />
          </Animated.View>

          <Animated.View entering={CustomCardEntrance(700)}>
            <SettingCard
              icon="star-outline"
              title="Rate Us"
              onPress={() => setIsRateUsVisible(true)}
            />
          </Animated.View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* How to Use Modal */}
      <Modal visible={isHowToUseVisible} animationType="slide" transparent={true}>
        <ExpoLinearGradient colors={['#020B2E', '#0A2F73']} style={styles.modalBackground}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsHowToUseVisible(false)} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>How to Use</Text>
              <View style={{ width: 44 }} />
            </View>
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <InstructionCard 
                icon="🚀" 
                title="Start" 
                description="Set your Focus Time, Break Time, and Cycles in Settings. Tap Start to begin your session." 
                delay={100} 
              />
              <InstructionCard 
                icon="🎯" 
                title="Focus" 
                description="Stay focused until the timer ends. The timer continues running even if you lock your phone or switch apps." 
                delay={200} 
              />
              <InstructionCard 
                icon="☕" 
                title="Break" 
                description="After each focus session, the break starts automatically. The app continues through all selected cycles until completion." 
                delay={300} 
              />
              <InstructionCard 
                icon="📊" 
                title="Activity" 
                description="Track your focus time, completed sessions, best day, and productivity streaks." 
                delay={400} 
              />
              <InstructionCard 
                icon="⚙️" 
                title="Customize" 
                description="Adjust Focus Duration, Break Duration, and Cycles anytime from Settings." 
                delay={500} 
              />
              <InstructionCard 
                icon="💡" 
                title="Tip" 
                description="Consistency is more important than long sessions. Start small and build the habit." 
                isTip={true}
                delay={600} 
              />
            </ScrollView>
          </SafeAreaView>
        </ExpoLinearGradient>
      </Modal>

      {/* Rate Us Modal */}
      <Modal visible={isRateUsVisible} animationType="fade" transparent={true}>
        <View style={styles.dialogOverlay}>
          <Animated.View entering={FadeInUp.springify()} style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>⭐ Rate FocusFlow</Text>
            <Text style={styles.dialogMessage}>
              FocusFlow is preparing for its first Google Play release.{'\n\n'}
              If you're enjoying the app, we'd love to hear your feedback. Your suggestions help us improve FocusFlow before launch.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity 
                style={styles.dialogPrimaryButton} 
                onPress={() => {
                  setIsRateUsVisible(false);
                  handleWriteUs();
                }}
              >
                <Text style={styles.dialogPrimaryButtonText}>💬 Send Feedback</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dialogSecondaryButton} 
                onPress={() => setIsRateUsVisible(false)}
              >
                <Text style={styles.dialogSecondaryButtonText}>👍 OK</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

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
    opacity: 0.015,
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
    marginBottom: 48,
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
    marginTop: 36,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingLeft: 8,
  },
  modalBackground: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 60,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(90, 170, 255, 0.4)',
    marginBottom: 16,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  instructionCardTip: {
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#FFD700',
  },
  instructionIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionIconWrapperTip: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  instructionIcon: {
    fontSize: 28,
  },
  instructionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  instructionTitleTip: {
    color: '#FFD700',
  },
  instructionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContainer: {
    width: '100%',
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(90, 170, 255, 0.2)',
    backgroundColor: 'rgba(18, 32, 78, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 15,
    color: '#A8C7FF',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  dialogButtons: {
    gap: 12,
  },
  dialogPrimaryButton: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  dialogPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dialogSecondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  dialogSecondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

