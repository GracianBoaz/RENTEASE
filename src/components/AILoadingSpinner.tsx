import React, { useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { theme } from '../constants/theme';

export function AILoadingSpinner({ message = 'AI is analyzing...' }) {
  const spin = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spinDegree = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate: spinDegree }] }]}>
        <Text style={styles.emoji}>🤖</Text>
      </Animated.View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  spinner: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emoji: {
    fontSize: 40,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
