import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { theme } from '../constants/theme';

interface SmartChipProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  style?: ViewStyle;
}

export function SmartChip({
  label,
  onPress,
  selected = false,
  removable = false,
  onRemove,
  style,
}: SmartChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.chipSelected,
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.text,
        selected && styles.textSelected,
      ]}>
        {label}
      </Text>
      {removable && (
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeButton}
        >
          <Text>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryLight,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  text: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope',
  },
  textSelected: {
    fontWeight: '600',
  },
  removeButton: {
    marginLeft: theme.spacing.xs,
    paddingHorizontal: 4,
  },
});
