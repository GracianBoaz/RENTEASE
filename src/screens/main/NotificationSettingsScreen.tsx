import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../constants/theme';

const DEFAULT_PREFS = {
  bookingUpdates: true,
  newMessages: true,
  listingActivity: false,
  priceAlerts: true,
  promotions: false,
  appUpdates: true,
};

const SETTINGS_LIST = [
  { key: 'bookingUpdates', icon: '🔔', title: 'Booking Updates', subtitle: 'Confirmations and cancellations' },
  { key: 'newMessages', icon: '💬', title: 'New Messages', subtitle: 'When someone messages you' },
  { key: 'listingActivity', icon: '📦', title: 'Listing Activity', subtitle: 'Views on your listings' },
  { key: 'priceAlerts', icon: '💰', title: 'Price Alerts', subtitle: 'Price drops on saved items' },
  { key: 'promotions', icon: '📣', title: 'Promotions', subtitle: 'Special offers and deals' },
  { key: 'appUpdates', icon: '📱', title: 'App Updates', subtitle: 'New features and improvements' },
];

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const [prefs, setPrefs] = useState<any>(DEFAULT_PREFS);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const stored = await AsyncStorage.getItem('notification_prefs');
      if (stored) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const togglePref = async (key: string) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    try {
      await AsyncStorage.setItem('notification_prefs', JSON.stringify(newPrefs));
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {SETTINGS_LIST.map((item, index) => (
          <View key={item.key} style={[styles.row, index === SETTINGS_LIST.length - 1 && styles.lastRow]}>
            <View style={styles.rowLeft}>
              <Text style={styles.icon}>{item.icon}</Text>
              <View>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#A855F7' }}
              thumbColor={prefs[item.key] ? '#6C3FE8' : '#fff'}
              onValueChange={() => togglePref(item.key)}
              value={prefs[item.key]}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { fontSize: 24, color: theme.colors.text },
  title: { ...theme.typography.h3, color: theme.colors.text },
  content: { padding: theme.spacing.lg, backgroundColor: theme.colors.white, marginTop: theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  lastRow: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 16 },
  icon: { fontSize: 24, marginRight: 16 },
  rowTitle: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 4 },
  rowSubtitle: { ...theme.typography.caption, color: theme.colors.textMuted },
});
