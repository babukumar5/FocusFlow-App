import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { haptics } from '@/src/utils/haptics';
import { AnimatedPressable } from '@/src/components/common/AnimatedPressable';

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
    <AnimatedPressable
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
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: PRIMARY_BLUE }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="rgba(255,255,255,0.1)"
          />
        ) : rightText ? (
          <Text style={styles.rightText}>
            {rightText}
          </Text>
        ) : !hideArrow ? (
          <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" style={styles.chevron} />
        ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(90, 170, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 12,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(30, 144, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  rightText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#A8C7FF',
  },
  chevron: {
    opacity: 0.8,
  }
});
