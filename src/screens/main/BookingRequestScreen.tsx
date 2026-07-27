import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';
import { runFraudDetection } from '../../services/FraudDetectionService';

type RequestRouteProp = RouteProp<SharedStackParamList, 'BookingRequest'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'BookingRequest'>;

export default function BookingRequestScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RequestRouteProp>();
  const { item } = route.params;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUserId(data.session.user.id);
    });
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDuration(diffDays);
      } else {
        setDuration(0);
      }
    }
  }, [startDate, endDate]);

  const serviceFee = duration > 0 ? 5 : 0;
  const total = (duration * item.price_per_day) + serviceFee;

  const handleRequestBooking = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to book');
      return;
    }
    if (duration <= 0) {
      Alert.alert('Error', 'Please enter valid dates (YYYY-MM-DD)');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        item_id: item.id,
        renter_id: userId,
        owner_id: item.owner_id,
        start_date: startDate,
        end_date: endDate,
        total_price: total,
        status: 'pending'
      })
      .select('id')
      .single();
    
    setLoading(false);

    if (error) {
      Alert.alert('Booking Failed', error.message);
    } else if (data) {
      if (data?.id) {
        runFraudDetection(data.id).catch(console.error);
      }
      navigation.replace('BookingConfirmation', {
        bookingId: data.id,
        item,
        startDate,
        endDate,
        totalPrice: total
      });
    }
  };

  const getImages = (images: any): string[] => {
    if (!images) return [];
    // Supabase text[] comes as real JS array already
    if (Array.isArray(images)) return images.filter(Boolean);
    // Fallback for string formats
    if (typeof images === 'string') {
      // PostgreSQL array format: {url1,url2}
      if (images.startsWith('{')) {
        return images
          .slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/^"|"$/g, ''))
          .filter(Boolean);
      }
      // JSON string format
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return typeof images === 'string' ? [images] : [];
      }
    }
    return [];
  };

  const images = getImages(item.images);
  const imageUrl = images.length > 0 ? images[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request to Book</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Item Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryImageContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.summaryImage} />
              ) : (
                <View style={[styles.summaryImage, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={24} color={theme.colors.textMuted} />
                </View>
              )}
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.summaryLocation} numberOfLines={1}>📍 {item.location_name || 'Location not specified'}</Text>
              <Text style={styles.summaryPrice}>₹{item.price_per_day} <Text style={styles.summaryPriceUnit}>/ day</Text></Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Select Dates</Text>
          <View style={styles.datesContainer}>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.label}>From</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
                <TextInput 
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textMuted}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
            </View>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.label}>To</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
                <TextInput 
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textMuted}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>
          </View>
          {duration > 0 && (
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.durationText}>Total duration: {duration} days</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
          <TextInput 
            style={styles.notesInput}
            placeholder="Add any specific needs or questions for the owner..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />

          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Price Breakdown</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>₹{item.price_per_day} × {duration} days</Text>
              <Text style={styles.breakdownValue}>₹{duration * item.price_per_day}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Service fee</Text>
              <Text style={styles.breakdownValue}>₹{serviceFee}</Text>
            </View>
            <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
              <Text style={styles.breakdownTotalLabel}>Total</Text>
              <Text style={styles.breakdownTotalValue}>₹{total}</Text>
            </View>
          </View>

          <Text style={styles.termsText}>
            By requesting to book, you agree to RentEase's Terms of Service and Privacy Policy. Your card will not be charged until the owner confirms.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRequestBooking} disabled={duration <= 0 || loading}>
            <LinearGradient
              colors={duration > 0 ? [theme.colors.primary, theme.colors.secondary] : [theme.colors.border, theme.colors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              <Text style={[styles.submitBtnText, duration <= 0 && { color: theme.colors.textMuted }]}>
                {loading ? 'Requesting...' : 'Send Booking Request'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text, fontSize: 20 },
  content: { flex: 1, padding: theme.spacing.lg },
  
  summaryCard: { flexDirection: 'row', backgroundColor: theme.colors.white, padding: theme.spacing.md, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.sm },
  summaryImageContainer: { width: 80, height: 80, borderRadius: theme.borderRadius.lg, overflow: 'hidden', backgroundColor: theme.colors.background },
  summaryImage: { width: '100%', height: '100%' },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  summaryDetails: { flex: 1, marginLeft: theme.spacing.md, justifyContent: 'center' },
  summaryTitle: { ...theme.typography.labelBold, fontSize: 16, color: theme.colors.text, marginBottom: 4 },
  summaryLocation: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: 8 },
  summaryPrice: { ...theme.typography.labelBold, color: theme.colors.primary, fontSize: 16 },
  summaryPriceUnit: { ...theme.typography.caption, color: theme.colors.textMuted },
  
  sectionTitle: { ...theme.typography.h3, fontSize: 18, color: theme.colors.text, marginBottom: theme.spacing.sm },
  datesContainer: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xs },
  dateInputWrapper: { flex: 1 },
  label: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing.md, height: 52, borderWidth: 2, borderColor: 'rgba(16, 185, 129, 0.1)' },
  dateInput: { flex: 1, marginLeft: 8, ...theme.typography.bodyMd, color: theme.colors.text },
  durationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.pill, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl },
  durationText: { ...theme.typography.labelBold, color: theme.colors.primary, marginLeft: 6 },
  
  notesInput: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, height: 100, borderWidth: 1, borderColor: theme.colors.border, ...theme.typography.bodyMd, color: theme.colors.text, marginBottom: theme.spacing.xl },
  
  breakdownCard: { backgroundColor: theme.colors.background, padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.xl },
  breakdownTitle: { ...theme.typography.labelBold, fontSize: 16, color: theme.colors.text, marginBottom: theme.spacing.md },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  breakdownValue: { ...theme.typography.bodyMd, color: theme.colors.text },
  breakdownTotalRow: { marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  breakdownTotalLabel: { ...theme.typography.h3, color: theme.colors.text },
  breakdownTotalValue: { ...theme.typography.h3, color: theme.colors.primary },
  
  termsText: { ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 20 },
  
  footer: { padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.lg },
  submitBtn: { height: 56, borderRadius: theme.borderRadius.pill, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 18 },
});
