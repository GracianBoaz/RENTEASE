import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthStackParamList';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type OTPRouteProp = RouteProp<AuthStackParamList, 'OTP'>;
type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTP'>;

export default function OTPScreen() {
  const route = useRoute<OTPRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { email } = route.params;
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isTokenFocused, setIsTokenFocused] = useState(false);

  const handleVerifyOTP = async () => {
    if (!token) {
      setErrorMsg('Please enter the verification code');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to <Text style={styles.boldText}>{email}</Text>
          </Text>

          <View style={styles.form}>
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code</Text>
              <View style={[styles.inputContainer, isTokenFocused && styles.inputFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor={theme.colors.textMuted}
                  value={token}
                  onChangeText={(text) => { setToken(text); setErrorMsg(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  onFocus={() => setIsTokenFocused(true)}
                  onBlur={() => setIsTokenFocused(false)}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, (loading || token.length < 6) && styles.primaryButtonDisabled]} 
              onPress={handleVerifyOTP} 
              disabled={loading || token.length < 6}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{loading ? 'Verifying...' : 'Verify Account'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  boldText: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
  },
  form: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    height: 64,
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0FDF4',
  },
  input: {
    flex: 1,
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
    fontSize: 16,
  },
});
