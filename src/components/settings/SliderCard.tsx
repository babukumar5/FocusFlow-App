import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated, Pressable } from 'react-native';
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
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <RNAnimated.View style={[styles.card, { transform: [{ scale }] }]}>
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
            maximumTrackTintColor="rgba(255, 255, 255, 0.1)" // iOS like track
            thumbTintColor="#FFFFFF"
          />
        </View>
      </RNAnimated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
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
    height: 98,
    justifyContent: 'center',
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
  title: {
    fontWeight: '600',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  valueText: {
    fontWeight: '500',
    fontSize: 17,
    color: '#A8C7FF',
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  slider: {
    width: '100%',
    height: 24,
  },
});
