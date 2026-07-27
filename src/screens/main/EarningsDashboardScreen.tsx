import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'EarningsDashboard'>;

// Dummy data for presentation
const DUMMY_TRANSACTIONS = [
  { id: 1, itemTitle: 'Sony A7III Camera', renter: 'Alex M.', date: 'May 12 - May 14', amount: 1500 },
  { id: 2, itemTitle: 'Power Drill Set', renter: 'Sarah K.', date: 'May 08 - May 09', amount: 300 },
  { id: 3, itemTitle: 'DJI Drone', renter: 'Mike T.', date: 'May 01 - May 03', amount: 2400 },
  { id: 4, itemTitle: 'Camping Tent 4-Person', renter: 'Lisa R.', date: 'Apr 25 - Apr 28', amount: 1200 },
];

export default function EarningsDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);

  // Mock bar chart data (height percentages)
  const chartBars = [30, 45, 20, 60, 80, 40, 90];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total Earnings Card */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalEarningsCard}
        >
          <Text style={styles.totalEarningsLabel}>Total Available Balance</Text>
          <Text style={styles.totalEarningsAmount}>₹5,400.00</Text>
          <View style={styles.totalEarningsBadge}>
            <Ionicons name="trending-up" size={16} color={theme.colors.white} />
            <Text style={styles.totalEarningsBadgeText}>+12% from last month</Text>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>₹4,200</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Bookings</Text>
            <Text style={styles.statValue}>24</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. / Day</Text>
            <Text style={styles.statValue}>₹850</Text>
          </View>
        </View>

        {/* Earnings Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Earnings Overview</Text>
            <Text style={styles.chartSubtitle}>Last 7 Days</Text>
          </View>
          
          <View style={styles.chartContainer}>
            {chartBars.map((heightPct, idx) => (
              <View key={idx} style={styles.barWrapper}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${heightPct}%` }]} />
                </View>
                <Text style={styles.barLabelText}>{days[idx]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.transactionsCard}>
          {DUMMY_TRANSACTIONS.map((t, idx) => (
            <React.Fragment key={t.id}>
              <View style={styles.transactionRow}>
                <View style={styles.transactionIconContainer}>
                  <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionItem}>{t.itemTitle}</Text>
                  <Text style={styles.transactionRenter}>{t.renter} • {t.date}</Text>
                </View>
                <Text style={styles.transactionAmount}>+₹{t.amount}</Text>
              </View>
              {idx < DUMMY_TRANSACTIONS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.withdrawBtn}
          >
            <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text, fontSize: 18 },
  
  content: { flex: 1, padding: theme.spacing.lg },
  
  totalEarningsCard: { padding: theme.spacing.xl, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.lg, ...theme.shadows.md },
  totalEarningsLabel: { ...theme.typography.bodyMd, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  totalEarningsAmount: { ...theme.typography.h1, color: theme.colors.white, marginBottom: 12 },
  totalEarningsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.pill, alignSelf: 'flex-start', gap: 6 },
  totalEarningsBadgeText: { ...theme.typography.caption, color: theme.colors.white, fontWeight: 'bold' },
  
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  statCard: { flex: 1, backgroundColor: theme.colors.white, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
  statLabel: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: 8 },
  statValue: { ...theme.typography.h3, color: theme.colors.text, fontSize: 18 },
  
  chartCard: { backgroundColor: theme.colors.white, padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
  cardTitle: { ...theme.typography.labelBold, color: theme.colors.text },
  chartSubtitle: { ...theme.typography.caption, color: theme.colors.textMuted },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 160, alignItems: 'flex-end', paddingTop: 20 },
  barWrapper: { alignItems: 'center', flex: 1 },
  barTrack: { width: 24, height: 120, backgroundColor: theme.colors.background, borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: 8 },
  barFill: { width: '100%', backgroundColor: theme.colors.primary, borderRadius: 12 },
  barLabelText: { ...theme.typography.caption, color: theme.colors.textMuted, fontSize: 11 },
  
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
  transactionsCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.xl, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.spacing.lg },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.md },
  transactionIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  transactionDetails: { flex: 1 },
  transactionItem: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 4 },
  transactionRenter: { ...theme.typography.caption, color: theme.colors.textMuted },
  transactionAmount: { ...theme.typography.labelBold, color: '#10B981', fontSize: 16 },
  divider: { height: 1, backgroundColor: theme.colors.border },
  
  footer: { padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border },
  withdrawBtn: { height: 56, borderRadius: theme.borderRadius.pill, justifyContent: 'center', alignItems: 'center' },
  withdrawBtnText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 18 },
});
