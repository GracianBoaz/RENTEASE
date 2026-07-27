import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackParamList } from '../../navigation/AuthStackParamList';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding1'>;

export default function Onboarding1Screen() {
  const navigation = useNavigation<NavigationProp>();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');
    if (hasSeen === 'true') {
      navigation.replace('Login');
    } else {
      setChecking(false);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('Login');
  };

  const handleNext = () => {
    navigation.navigate('Onboarding2');
  };

  if (checking) return <View style={styles.container} />;

  return (
    <LinearGradient
      colors={[theme.colors.secondary, theme.colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.emoji}>🛵</Text>
          </View>
          <Text style={styles.title}>Rent What You Need</Text>
          <Text style={styles.subtitle}>
            Access EVs, gadgets, tools and equipment near you at affordable daily rates.
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotInactive]} />
            <View style={[styles.dot, styles.dotInactive]} />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.9}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.lg },
  iconCircle: {
    width: width * 0.45,
    height: width * 0.45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  emoji: { fontSize: 80 },
  title: {
    ...theme.typography.h2,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...theme.typography.bodyLg,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomSection: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl, alignItems: 'center' },
  dotsContainer: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing.xl, justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: theme.colors.white },
  dotInactive: { width: 8, backgroundColor: 'rgba(255,255,255,0.4)' },
  buttonContainer: { width: '100%', gap: theme.spacing.md },
  nextButton: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.pill,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  nextButtonText: { ...theme.typography.labelBold, color: theme.colors.accent, fontSize: 18 },
  skipButton: { height: 50, justifyContent: 'center', alignItems: 'center' },
  skipButtonText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 16, opacity: 0.9 },
});
