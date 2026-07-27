import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

const DISTANCES = [1, 5, 10, 25];
const CONDITIONS = ['new', 'like_new', 'good', 'fair'];

export default function AdvancedFiltersScreen() {
  const navigation = useNavigation();
  const [distance, setDistance] = useState(10);
  const [condition, setCondition] = useState('good');
  const [minRating, setMinRating] = useState(4);

  const handleApply = () => {
    // In a real app, you would pass these back to SearchScreen
    navigation.goBack();
  };

  const handleReset = () => {
    setDistance(10);
    setCondition('good');
    setMinRating(4);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Reset All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Distance Radius</Text>
        <View style={styles.row}>
          {DISTANCES.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, distance === d && styles.chipActive]}
              onPress={() => setDistance(d)}
            >
              <Text style={[styles.chipText, distance === d && styles.chipTextActive]}>{d} km</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Condition</Text>
        <View style={styles.row}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, condition === c && styles.chipActive]}
              onPress={() => setCondition(c)}
            >
              <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{c.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Minimum Rating</Text>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, minRating === r && styles.chipActive]}
              onPress={() => setMinRating(r)}
            >
              <Text style={[styles.chipText, minRating === r && styles.chipTextActive]}>{r} ⭐</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleApply}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Apply Filters</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  resetText: {
    ...theme.typography.labelBold,
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    ...theme.typography.bodySm,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  footer: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    height: 52,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
    fontSize: 16,
  },
});
