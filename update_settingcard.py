import re

content = """import React from 'react';
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
        <MaterialCommunityIcons name={icon} size={24} color={PRIMARY_BLUE} />
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
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
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
    f.write(content)
