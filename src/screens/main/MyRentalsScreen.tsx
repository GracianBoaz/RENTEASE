import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'RentalsMain'>;

const STATUS_COLORS: any = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  active: '#22C55E',
  completed: '#6B7280',
  cancelled: '#EF4444',
};

export default function MyRentalsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<'renting' | 'listings'>('renting');
  const [rentingSubTab, setRentingSubTab] = useState<'active' | 'past' | 'cancelled'>('active');
  const [userId, setUserId] = useState<string | null>(null);

  // Data
  const [rentals, setRentals] = useState<any[]>([]);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUserId(data.session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (userId) {
      if (activeTab === 'renting') {
        fetchRentals();
      } else {
        fetchListings();
      }
    }
  }, [userId, activeTab]);

  const fetchRentals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, items(title, location_name, price_per_day, category_id)')
      .eq('renter_id', userId);
    setLoading(false);
    if (data) setRentals(data);
  };

  const fetchListings = async () => {
    setLoading(true);
    const [itemsRes, requestsRes] = await Promise.all([
      supabase.from('items').select('*, bookings(count)').eq('owner_id', userId),
      supabase.from('bookings').select('*, items(title), profiles!renter_id(full_name)').eq('owner_id', userId).eq('status', 'pending'),
    ]);
    setLoading(false);
    if (itemsRes.data) setMyItems(itemsRes.data);
    if (requestsRes.data) setIncomingRequests(requestsRes.data);
  };

  const toggleAvailability = async (itemId: string, current: boolean) => {
    await supabase.from('items').update({ is_available: !current }).eq('id', itemId);
    fetchListings();
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
    if (!error) {
      if (activeTab === 'renting') fetchRentals();
      else fetchListings();
    } else {
      Alert.alert('Error', error.message);
    }
  };

  const renderRentingTab = () => {
    const filteredRentals = rentals.filter((r) => {
      if (rentingSubTab === 'active') return ['pending', 'confirmed', 'active'].includes(r.status);
      if (rentingSubTab === 'past') return r.status === 'completed';
      if (rentingSubTab === 'cancelled') return r.status === 'cancelled';
      return false;
    });

    return (
      <View style={styles.tabContent}>
        <View style={styles.subTabsContainer}>
          {(['active', 'past', 'cancelled'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.subTab, rentingSubTab === tab && styles.subTabActive]}
              onPress={() => setRentingSubTab(tab)}
            >
              <Text style={[styles.subTabText, rentingSubTab === tab && styles.subTabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color={theme.colors.primary} />
        ) : filteredRentals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyText}>No rentals yet, Browse items!</Text>
          </View>
        ) : (
          filteredRentals.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.card}
              onPress={() => navigation.navigate('BookingDetail', { bookingId: booking.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>📦 {booking.items?.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[booking.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] }]}>{booking.status}</Text>
                </View>
              </View>
              <Text style={styles.cardDates}>{booking.start_date} → {booking.end_date}</Text>
              <Text style={styles.cardPrice}>₹{booking.total_price}</Text>

              {booking.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.outlineButton, { borderColor: theme.colors.error, marginTop: theme.spacing.md }]}
                  onPress={() => navigation.navigate('CancelBooking', { bookingId: booking.id, item: booking.items, startDate: booking.start_date, endDate: booking.end_date })}
                >
                  <Text style={[styles.outlineButtonText, { color: theme.colors.error }]}>Cancel Booking</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderListingsTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity onPress={() => navigation.navigate('AddItemStep1', {})}>
        <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.listNewBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.listNewBtnText}>+ List New Item</Text>
        </LinearGradient>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={theme.colors.primary} />
      ) : myItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyText}>Start earning, List your first item!</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>My Items</Text>
          {myItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => navigation.navigate('ItemDetail', { item })}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>📦 {item.title}</Text>
                <Switch
                  value={item.is_available}
                  onValueChange={() => toggleAvailability(item.id, item.is_available)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>
              <Text style={styles.cardDetails}>₹{item.price_per_day}/day</Text>
              <Text style={styles.cardDetails}>{item.bookings?.[0]?.count || 0} Bookings total</Text>
            </TouchableOpacity>
          ))}

          {incomingRequests.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>Incoming Requests</Text>
              {incomingRequests.map((req) => (
                <View key={req.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{req.profiles?.full_name} requested {req.items?.title}</Text>
                  <Text style={styles.cardDates}>{req.start_date} → {req.end_date}</Text>
                  <Text style={styles.cardPrice}>Total: ₹{req.total_price}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.success }]} onPress={() => updateBookingStatus(req.id, 'confirmed')}>
                      <Text style={styles.actionBtnText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.error }]} onPress={() => updateBookingStatus(req.id, 'cancelled')}>
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.mainTabContainer}>
          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'renting' && styles.mainTabActive]}
            onPress={() => setActiveTab('renting')}
          >
            <Text style={[styles.mainTabText, activeTab === 'renting' && styles.mainTabTextActive]}>🛒 Renting</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'listings' && styles.mainTabActive]}
            onPress={() => setActiveTab('listings')}
          >
            <Text style={[styles.mainTabText, activeTab === 'listings' && styles.mainTabTextActive]}>📦 My Listings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {activeTab === 'renting' ? renderRentingTab() : renderListingsTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mainTabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.pill,
    padding: 4,
  },
  mainTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.pill,
  },
  mainTabActive: {
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainTabText: {
    ...theme.typography.labelBold,
    color: theme.colors.textMuted,
  },
  mainTabTextActive: {
    color: theme.colors.text,
  },
  tabContent: {
    padding: theme.spacing.lg,
  },
  subTabsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  subTab: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomColor: theme.colors.primary,
  },
  subTabText: {
    ...theme.typography.labelBold,
    color: theme.colors.textMuted,
  },
  subTabTextActive: {
    color: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.bodyLg,
    color: theme.colors.textMuted,
  },
  card: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.pill,
  },
  statusText: {
    ...theme.typography.caption,
    textTransform: 'capitalize',
  },
  cardDates: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  cardPrice: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  cardDetails: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  outlineButton: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  outlineButtonText: {
    ...theme.typography.labelBold,
  },
  listNewBtn: {
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  listNewBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
    fontSize: 16,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  actionBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
  },
});
