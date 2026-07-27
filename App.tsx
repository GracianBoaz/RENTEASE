import 'react-native-url-polyfill/auto';
import { fetch as expoFetch } from 'expo/fetch';
import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/utils/supabase';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { theme } from './src/constants/theme';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.white,
    text: theme.colors.text,
    border: theme.colors.border,
  },
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const onboarded = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasOnboarded(onboarded === 'true');

        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F4F3F6',
      }}>
        <ActivityIndicator size="large" color="#6C3FE8" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="dark" />
          <RootNavigator session={session} hasOnboarded={hasOnboarded} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
