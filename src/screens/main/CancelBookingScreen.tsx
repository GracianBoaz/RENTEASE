import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type CancelRouteProp = RouteProp<SharedStackParamList, 'CancelBooking'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'CancelBooking'>;

const REASONS = [
  'Found a better option',
  'Dates changed',
  'Item not as described',
  'Owner not responding',
  'Other reason',
];

export default function CancelBookingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CancelRouteProp>();
  const { bookingId, item, startDate, endDate } = route.params;

  const [reason, setReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!reason) {
      Alert.alert('Error', 'Please select a cancellation reason');
      return;
    }
    setLoading(true);
    // Realistically you might also save the reason, but we just update status
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.');
      navigation.navigate('RentalsMain');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cancel Booking</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.itemTitle}>📦 {item.title}</Text>
          <Text style={styles.datesText}>{startDate} to {endDate}</Text>
        </View>

        <Text style={styles.sectionTitle}>Reason for cancellation</Text>
        {REASONS.map((r) => (
          <TouchableOpacity key={r} style={styles.radioRow} onPress={() => setReason(r)}>
            <View style={[styles.radioCircle, reason === r && styles.radioActive]} />
            <Text style={styles.radioText}>{r}</Text>
          </TouchableOpacity>
        ))}

        {reason === 'Other reason' && (
          <TextInput style={{
            backgroundColor: '#F0EEF4',
            borderRadius: 12,
            padding: 12,
            fontSize: 15,
            color: '#1A1625',
            borderWidth: 1.5,
            borderColor: 'rgba(108,63,232,0.12)',
          }}
          placeholderTextColor="#A09AB0" 
            
            placeholder="Please specify..."
            value={otherReason}
            onChangeText={setOtherReason}
            multiline
          />
        )}

        <View style={styles.policyCard}>
          <Text style={styles.policyText}>
            Cancellation is free if done 24 hours before rental starts.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.confirmBtn} 
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.confirmBtnText}>{loading ? 'Cancelling...' : 'Confirm Cancellation'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.keepBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.keepBtnText}>Keep My Booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { ...theme.typography.labelBold, color: theme.colors.text, marginRight: theme.spacing.lg },
  title: { ...theme.typography.h2, color: theme.colors.error },
  content: { flex: 1, padding: theme.spacing.lg },
  card: { backgroundColor: theme.colors.white, padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.xl, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  itemTitle: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: theme.spacing.xs },
  datesText: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.border, marginRight: theme.spacing.sm },
  radioActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  radioText: { ...theme.typography.bodyMd, color: theme.colors.text },
  input: { height: 80, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, backgroundColor: theme.colors.white, ...theme.typography.bodyMd, textAlignVertical: 'top', marginBottom: theme.spacing.xl },
  policyCard: { backgroundColor: theme.colors.error + '10', padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginTop: theme.spacing.xl },
  policyText: { ...theme.typography.caption, color: theme.colors.error },
  footer: { padding: theme.spacing.xl, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: theme.spacing.md },
  confirmBtn: { paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.xl, backgroundColor: theme.colors.error, alignItems: 'center', justifyContent: 'center', height: 52 },
  confirmBtnText: { ...theme.typography.labelBold, color: theme.colors.white },
  keepBtn: { paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.xl, borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', height: 52 },
  keepBtnText: { ...theme.typography.labelBold, color: theme.colors.text },
});
