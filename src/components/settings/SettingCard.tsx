import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated, Pressable, Switch } from 'react-native';
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
  const scale = useRef(new RNAnimated.Value(1)).current;

  const handlePressIn = () => {
    RNAnimated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    RNAnimated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        if (!isSwitch && onPress) {
          haptics.lightTap();
          onPress();
        }
      }}
    >
      <RNAnimated.View style={[styles.card, { transform: [{ scale }] }]}>
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
      </RNAnimated.View>
    </Pressable>
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
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
