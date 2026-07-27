import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function NoInternetScreen({ onRetry }: { onRetry: () => void }) {
  const [shakeAnimation] = React.useState(new Animated.Value(0));

  const handleRetry = async () => {
    // Trigger shake animation to give UI feedback
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();

    onRetry();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📡</Text>
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.subtitle}>
          Please check your WiFi or mobile data connection and try again
        </Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
          <TouchableOpacity onPress={handleRetry}>
            <LinearGradient
              colors={['#6C3FE8', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: { fontFamily: 'Epilogue-ExtraBold', fontSize: 24, color: '#1A1625', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontFamily: 'Manrope-Regular', fontSize: 15, color: '#6B6478', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  retryBtn: { width: 200, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
