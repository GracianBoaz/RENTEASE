import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';

type ConfirmRouteProp = RouteProp<SharedStackParamList, 'BookingConfirmation'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'BookingConfirmation'>;

export default function BookingConfirmationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ConfirmRouteProp>();
  const { bookingId, item, startDate, endDate, totalPrice } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Animation Area */}
        <View style={styles.successHeader}>
          <View style={styles.iconRingOuter}>
            <View style={styles.iconRingInner}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark" size={48} color={theme.colors.white} />
              </View>
            </View>
          </View>
          <Text style={styles.title}>Booking Requested!</Text>
          <Text style={styles.subtitle}>Your request has been sent to the owner.</Text>
        </View>

        {/* Confirmation Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Confirmation Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference ID</Text>
            <Text style={styles.detailValueBold}>#{bookingId.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Item</Text>
            <Text style={styles.detailValue}>{item.title}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dates</Text>
            <Text style={styles.detailValue}>{startDate} to {endDate}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Amount</Text>
            <Text style={[styles.detailValueBold, { color: theme.colors.primary }]}>₹{totalPrice}</Text>
          </View>
        </View>

        {/* What happens next? */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What happens next?</Text>
          <View style={styles.step}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepText}>Owner reviews your request</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepText}>Owner confirms within 24 hours</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepText}>Pickup/receive your item</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={{ flex: 1 }}
          onPress={() => navigation.navigate('HomeMain')} // Redirect appropriately, assuming HomeMain exists or similar
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>View My Bookings</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('HomeMain')}>
          <Text style={styles.secondaryButtonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: theme.spacing.lg },
  
  successHeader: { alignItems: 'center', marginVertical: theme.spacing.xxl },
  iconRingOuter: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.lg },
  iconRingInner: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center' },
  iconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', ...theme.shadows.md },
  title: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 8 },
  subtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  
  card: { backgroundColor: theme.colors.white, padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.sm },
  cardTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.lg },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  detailValue: { ...theme.typography.labelBold, color: theme.colors.text },
  detailValueBold: { ...theme.typography.h3, fontSize: 16, color: theme.colors.text },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.md },
  
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  stepNumberContainer: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: theme.colors.primary },
  stepNumber: { ...theme.typography.labelBold, color: theme.colors.primary, fontSize: 14 },
  stepText: { ...theme.typography.bodyMd, color: theme.colors.text },
  
  footer: { padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: theme.spacing.md },
  primaryButton: { height: 56, borderRadius: theme.borderRadius.pill, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 16 },
  secondaryButton: { height: 56, borderRadius: theme.borderRadius.pill, borderWidth: 2, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.white },
  secondaryButtonText: { ...theme.typography.labelBold, color: theme.colors.text, fontSize: 16 },
});
