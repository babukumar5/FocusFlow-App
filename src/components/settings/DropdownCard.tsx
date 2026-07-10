import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius } from '@/src/constants';
import { haptics } from '@/src/utils/haptics';

interface DropdownCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
}

export default function DropdownCard({
  icon,
  title,
  value,
  options,
  onSelect,
}: DropdownCardProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  const openMenu = () => {
    haptics.lightTap();
    setVisible(true);
  };

  const closeMenu = () => setVisible(false);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <TouchableOpacity activeOpacity={0.7} onPress={openMenu} style={styles.anchor}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}1A` }]}>
              <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.contentContainer}>
              <Text style={[styles.title, { color: theme.colors.onSurface, ...theme.fonts.bodyLarge }]}>
                {title}
              </Text>
            </View>
            <Text style={[styles.valueText, { color: theme.colors.primary, ...theme.fonts.bodyMedium }]}>
              {value}
            </Text>
            <MaterialCommunityIcons name="menu-down" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        }
        contentStyle={{ backgroundColor: theme.colors.elevation.level2, borderRadius: borderRadius.md }}
      >
        {options.map((opt) => (
          <Menu.Item
            key={opt}
            onPress={() => {
              haptics.selection();
              onSelect(opt);
              closeMenu();
            }}
            title={opt}
            titleStyle={{ color: opt === value ? theme.colors.primary : theme.colors.onSurface }}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  anchor: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
  },
  valueText: {
    fontWeight: '600',
    marginRight: spacing.xs,
  },
});
