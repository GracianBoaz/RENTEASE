import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type DetailRouteProp = RouteProp<SharedStackParamList, 'BookingDetail'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'BookingDetail'>;

const STATUS_COLORS: any = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  active: '#22C55E',
  completed: '#6B7280',
  cancelled: '#EF4444',
};

export default function BookingDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUserId(data.session.user.id);
    });
    fetchBooking();
  }, []);

  const fetchBooking = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *, 
        items(*), 
        renter:profiles!bookings_renter_id_fkey(full_name, phone),
        owner:profiles!bookings_owner_id_fkey(full_name, phone)
      `)
      .eq('id', bookingId)
      .single();
    setBooking(data);
    setLoading(false);
  };

  const updateStatus = async (status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', bookingId);
    fetchBooking();
  };

  if (loading || !booking) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const isRenter = userId === booking.renter_id;
  const isOwner = userId === booking.owner_id;
  const oppositeProfile = isRenter ? booking.owner : booking.renter;

  // Calculate duration
  const start = new Date(booking.start_date);
  const end = new Date(booking.end_date);
  const duration = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const getTimelineStatus = (step: string) => {
    if (booking.status === 'cancelled') return 'cancelled';
    const states = ['pending', 'confirmed', 'active', 'completed'];
    const currentIdx = states.indexOf(booking.status);
    const stepIdx = states.indexOf(step);
    if (stepIdx <= currentIdx) return 'done';
    return 'pending';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Booking #{bookingId.slice(0, 8).toUpperCase()}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[booking.status] + '20' }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLORS[booking.status] }]}>{booking.status}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.itemCard}
          onPress={() => navigation.navigate('ItemDetail', { item: booking.items })}
        >
          <Text style={styles.itemTitle}>📦 {booking.items?.title}</Text>
          <Text style={styles.itemPrice}>₹{booking.items?.price_per_day}/day</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rental Period</Text>
          <Text style={styles.detailText}>📅 Start: {booking.start_date}</Text>
          <Text style={styles.detailText}>📅 End: {booking.end_date}</Text>
          <Text style={styles.detailText}>⏱ Duration: {duration} days</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.detailText}>Total Amount</Text>
            <Text style={styles.totalPrice}>₹{booking.total_price}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{isRenter ? 'Owner Info' : 'Renter Info'}</Text>
          <Text style={styles.profileName}>{oppositeProfile?.full_name}</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${oppositeProfile?.phone || '000'}`)}>
              <Text>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBtn}>
              <Text>💬 Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {booking.items?.lat && booking.items?.lng && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pickup Location</Text>
            <View style={styles.mapContainer}>
              <WebView
                source={{ uri: `https://maps.google.com/maps?q=${booking.items.lat},${booking.items.lng}&z=15&output=embed` }}
                style={styles.map}
                scrollEnabled={false}
              />
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {(['pending', 'confirmed', 'active', 'completed'] as const).map((step, idx) => {
            const state = getTimelineStatus(step);
            let icon = state === 'done' ? '✅' : '⏳';
            if (state === 'cancelled') icon = '❌';
            return (
              <View key={step} style={styles.timelineStep}>
                <Text style={styles.timelineIcon}>{icon}</Text>
                <Text style={[styles.timelineText, state === 'done' && styles.timelineTextDone]}>
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isRenter && booking.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: theme.colors.error, borderWidth: 1 }]}
            onPress={() => navigation.navigate('CancelBooking', { 
              bookingId, 
              item: booking.items, 
              startDate: booking.start_date, 
              endDate: booking.end_date 
            })}
          >
            <Text style={[styles.actionBtnText, { color: theme.colors.error }]}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
        
        {isOwner && booking.status === 'pending' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.error, flex: 1 }]} onPress={() => updateStatus('cancelled')}>
              <Text style={[styles.actionBtnText, { color: theme.colors.white }]}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.success, flex: 1 }]} onPress={() => updateStatus('confirmed')}>
              <Text style={[styles.actionBtnText, { color: theme.colors.white }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}

        {isRenter && booking.status === 'completed' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.actionBtnText, { color: theme.colors.white }]}>Write Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: theme.spacing.lg },
  header: { alignItems: 'center', marginBottom: theme.spacing.xl },
  title: { ...theme.typography.h2, color: theme.colors.text },
  badge: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.pill, marginTop: theme.spacing.sm },
  badgeText: { ...theme.typography.labelBold, textTransform: 'capitalize' },
  card: { backgroundColor: theme.colors.white, padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.md, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  itemCard: { backgroundColor: theme.colors.white, padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.md, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { ...theme.typography.labelBold, color: theme.colors.text },
  itemPrice: { ...theme.typography.labelBold, color: theme.colors.primary },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
  detailText: { ...theme.typography.bodyMd, color: theme.colors.textMuted, marginBottom: theme.spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalPrice: { ...theme.typography.h3, color: theme.colors.primary },
  profileName: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: theme.spacing.md },
  contactRow: { flexDirection: 'row', gap: theme.spacing.md },
  contactBtn: { flex: 1, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  mapContainer: { height: 180, borderRadius: 14, overflow: 'hidden' },
  map: { flex: 1 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  timelineIcon: { fontSize: 24, marginRight: theme.spacing.sm },
  timelineText: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  timelineTextDone: { color: theme.colors.text, ...theme.typography.labelBold },
  footer: { padding: theme.spacing.xl, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border },
  actionBtn: { paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.xl, alignItems: 'center', justifyContent: 'center', height: 52 },
  actionBtnText: { ...theme.typography.labelBold },
});
