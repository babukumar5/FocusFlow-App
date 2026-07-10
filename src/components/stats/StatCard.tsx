import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AnimatedNumber from './AnimatedNumber';
import { spacing, borderRadius, elevation } from '@/src/constants';

interface StatCardProps {
  title: string;
  value: number;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBgColor: string;
  formatAs?: 'integer' | 'decimal';
}

export default function StatCard({
  title,
  value,
  iconName,
  iconColor,
  iconBgColor,
  formatAs,
}: StatCardProps) {
  const theme = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
            <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
          </View>
        </View>
        <Text style={[styles.title, { color: theme.colors.onSurfaceVariant, ...theme.fonts.labelSmall }]}>
          {title}
        </Text>
        <AnimatedNumber
          value={value}
          formatAs={formatAs}
          style={[styles.value, { color: theme.colors.onSurface, ...theme.fonts.displaySmall }]}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    ...elevation.sm,
  },
  content: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    opacity: 0.85,
    marginBottom: 4,
    fontSize: 12,
  },
  value: {
    fontWeight: '700',
    fontSize: 24,
  },
});
