import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../constants/theme';

interface FeedbackCardProps {
  icon: string;
  title: string;
  content: string;
  type: 'success' | 'warning' | 'error' | 'info';
  expandable?: boolean;
  confidence?: number;
}

export function FeedbackCard({
  icon,
  title,
  content,
  type,
  expandable = false,
  confidence,
}: FeedbackCardProps) {
  const [expanded, setExpanded] = useState(false);

  const typeColor = {
    success: { bg: '#ECFDF5', text: '#059669', border: '#D1FAE5' },
    warning: { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D' },
    error: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
    info: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  };

  const colors = typeColor[type];

  return (
    <TouchableOpacity
      onPress={() => expandable && setExpanded(!expanded)}
      activeOpacity={expandable ? 0.7 : 1}
    >
      <View style={[
        styles.container,
        { 
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}>
        <View style={styles.header}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>
            {confidence !== undefined && (
              <Text style={styles.confidence}>
                Confidence: {Math.round(confidence * 100)}%
              </Text>
            )}
          </View>
          {expandable && (
            <Text style={styles.expandIcon}>
              {expanded ? '▼' : '▶'}
            </Text>
          )}
        </View>
        
        {(expanded || !expandable) && (
          <Text style={[styles.content, { color: colors.text }]}>
            {content}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Manrope',
  },
  confidence: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  content: {
    fontSize: 14,
    fontFamily: 'Manrope',
    marginTop: theme.spacing.md,
    lineHeight: 20,
  },
  expandIcon: {
    fontSize: 12,
    marginLeft: theme.spacing.md,
  },
});
