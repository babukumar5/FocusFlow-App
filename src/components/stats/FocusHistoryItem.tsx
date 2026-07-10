import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { spacing, borderRadius } from '@/src/constants';

interface FocusHistoryItemProps {
  taskTitle: string;
  date: string;
  durationMinutes: number;
  mode: string;
  isLast?: boolean;
}

export default function FocusHistoryItem({
  taskTitle,
  date,
  durationMinutes,
  mode,
  isLast = false,
}: FocusHistoryItemProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, !isLast && { borderBottomColor: theme.colors.outlineVariant, borderBottomWidth: 1 }]}>
      <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons 
          name={mode === 'focus' ? 'timer-sand' : 'coffee'} 
          size={18} 
          color={theme.colors.primary} 
        />
      </View>
      
      <View style={styles.details}>
        <Text style={[styles.title, { color: theme.colors.onSurface, ...theme.fonts.bodyLarge }]} numberOfLines={1}>
          {taskTitle}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant, ...theme.fonts.bodySmall }]}>
          {date} • {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
        </Text>
      </View>
      
      <View style={[styles.durationBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text style={[styles.durationText, { color: theme.colors.onSurface, ...theme.fonts.labelMedium }]}>
          {durationMinutes}m
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    opacity: 0.8,
  },
  durationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.md,
  },
  durationText: {
    fontWeight: '600',
  },
});
