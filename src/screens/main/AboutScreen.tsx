import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

export default function AboutScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About RentEase</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>RentEase</Text>
          <Text style={styles.versionText}>v1.0.0</Text>
          <Text style={styles.tagline}>Rent anything, anywhere</Text>
          <Text style={styles.madeIn}>Made with ❤️ in India 🇮🇳</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardText}>
            RentEase connects people who have idle items with people who need them temporarily. We believe in a shared economy where resources are used efficiently and everyone benefits.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How It Works</Text>
          <View style={styles.stepRow}>
            <View style={styles.circle}><Text style={styles.circleText}>1</Text></View>
            <Text style={styles.stepText}>Browse items near your location</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.circle}><Text style={styles.circleText}>2</Text></View>
            <Text style={styles.stepText}>Book and connect with owner</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.circle}><Text style={styles.circleText}>3</Text></View>
            <Text style={styles.stepText}>Rent, return, and review</Text>
          </View>
        </View>

        <View style={styles.linksCard}>
          <TouchableOpacity style={styles.linkRow} onPress={() => Alert.alert('Coming Soon')}>
            <Text style={styles.icon}>📄</Text><Text style={styles.linkLabel}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => Alert.alert('Coming Soon')}>
            <Text style={styles.icon}>📋</Text><Text style={styles.linkLabel}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => Alert.alert('Coming Soon')}>
            <Text style={styles.icon}>⚖️</Text><Text style={styles.linkLabel}>Open Source Licenses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://instagram.com/rentease')}>
            <Text style={styles.icon}>📸</Text><Text style={styles.linkLabel}>Follow on Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://twitter.com/rentease')}>
            <Text style={styles.icon}>🐦</Text><Text style={styles.linkLabel}>Follow on Twitter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 RentEase</Text>
          <Text style={styles.footerText}>All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { fontSize: 24, color: theme.colors.text },
  title: { ...theme.typography.h3, color: theme.colors.text },
  content: { padding: theme.spacing.lg },
  logoSection: { alignItems: 'center', marginVertical: 32 },
  logoText: { fontSize: 40, fontWeight: '800', color: theme.colors.primary, marginBottom: 4 },
  versionText: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: 8 },
  tagline: { ...theme.typography.bodyMd, color: '#6B6478', marginBottom: 32 },
  madeIn: { ...theme.typography.labelBold, color: theme.colors.text },
  card: { backgroundColor: theme.colors.white, borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardTitle: { ...theme.typography.h3, color: theme.colors.primary, marginBottom: 12 },
  cardText: { ...theme.typography.bodyMd, color: theme.colors.text, lineHeight: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  circle: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  circleText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 12 },
  stepText: { ...theme.typography.bodyMd, color: theme.colors.text },
  linksCard: { backgroundColor: theme.colors.white, borderRadius: 20, overflow: 'hidden', marginBottom: 32 },
  linkRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  icon: { fontSize: 20, marginRight: 16 },
  linkLabel: { ...theme.typography.bodyMd, color: theme.colors.text },
  footer: { alignItems: 'center', marginBottom: 40 },
  footerText: { ...theme.typography.caption, color: '#A09AB0' },
});
