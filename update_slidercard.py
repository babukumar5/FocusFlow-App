import re

content = """import React from 'react';
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
            <MaterialCommunityIcons name={icon} size={24} color={PRIMARY_BLUE} />
          </View>
          <Text style={styles.title}>
            {title}
          </Text>
        </View>
        <Text style={styles.valueText}>
          {value}{unit}
        </Text>
      </View>
      
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
        thumbTintColor={PRIMARY_BLUE}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
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
  slider: {
    width: '100%',
    height: 40,
  },
});
"""

with open("src/components/settings/SliderCard.tsx", "w") as f:
    f.write(content)
