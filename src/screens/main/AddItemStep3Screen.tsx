import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Switch, Platform, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AddressManager, { UserAddress } from '../../components/AddressManager';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';

type Step3RouteProp = RouteProp<SharedStackParamList, 'AddItemStep3'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'AddItemStep3'>;

export default function AddItemStep3Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Step3RouteProp>();
  const { itemData } = route.params;

  const [locationData, setLocationData] = useState({
    location_lat: 0,
    location_lng: 0,
    location_address: '',
    location_pincode: '',
    location_city: '',
    location_state: '',
  });
  const [availableNow, setAvailableNow] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleAddressSelected = (address: UserAddress) => {
    setLocationData({
      location_lat: address.location_lat || 0,
      location_lng: address.location_lng || 0,
      location_address: `${address.flat_house_no}, ${address.area_street_village}`,
      location_pincode: address.pincode,
      location_city: address.town_city,
      location_state: address.state,
    });
  };

  const handleNext = () => {
    if (!locationData.location_lat || !locationData.location_lng) {
      Alert.alert(
        'Location Required',
        'Please set your item location using GPS or pincode before publishing.',
        [{ text: 'OK' }]
      );
      return;
    }
    const updatedItemData = {
      ...itemData,
      ...locationData,
      locationName: locationData.location_city ? `${locationData.location_address}` : 'Location unknown',
      availableNow,
    };
    navigation.navigate('ItemPreview', { itemData: updatedItemData });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step 3 of 3</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '100%' }]} />
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Location & Review</Text>
          <Text style={styles.headerSubtitle}>Almost there! Where is the item located?</Text>
        </View>

        {/* Location Section */}
        <AddressManager onAddressSelected={handleAddressSelected} />

        <View style={styles.divider} />

        {/* Review Summary */}
        <Text style={styles.sectionTitle}>Review Listing</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Title</Text>
              <Text style={styles.summaryValue}>{itemData.title}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AddItemStep1' as any)}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Pricing</Text>
              <Text style={styles.summaryValue}>₹{itemData.pricePerDay} / day</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AddItemStep2' as any)}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Photos</Text>
              <Text style={styles.summaryValue}>{itemData.images?.length || 0} Photos added</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AddItemStep2' as any)}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityCard}>
          <View>
            <Text style={styles.availabilityTitle}>Available Now</Text>
            <Text style={styles.availabilityDesc}>Item is ready to be booked immediately</Text>
          </View>
          <Switch 
            value={availableNow} 
            onValueChange={setAvailableNow} 
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }} 
            thumbColor={Platform.OS === 'ios' ? '#FFF' : availableNow ? theme.colors.white : '#f4f3f4'}
          />
        </View>

        {/* Terms */}
        <TouchableOpacity 
          style={styles.termsRow}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
            {agreedToTerms && <Ionicons name="checkmark" size={16} color={theme.colors.white} />}
          </View>
          <Text style={styles.termsText}>
            I confirm the details are accurate and agree to RentEase's Terms of Service.
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleNext} disabled={!agreedToTerms}>
          <LinearGradient
            colors={agreedToTerms ? [theme.colors.primary, theme.colors.secondary] : [theme.colors.border, theme.colors.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextBtn}
          >
            <Text style={[styles.nextBtnText, !agreedToTerms && { color: theme.colors.textMuted }]}>
              Submit Listing 🎉
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  progressContainer: { flex: 1, alignItems: 'center', marginHorizontal: theme.spacing.lg },
  progressText: { ...theme.typography.labelBold, color: theme.colors.primary, marginBottom: 8, fontSize: 14 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: theme.colors.border, borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: theme.colors.primary, borderRadius: 3 },
  
  content: { flex: 1, padding: theme.spacing.lg },
  headerTextContainer: { marginBottom: theme.spacing.xl },
  headerTitle: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 4 },
  headerSubtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  
  locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1.5, borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '05', marginBottom: theme.spacing.lg, gap: 8 },
  locationBtnText: { ...theme.typography.labelBold, color: theme.colors.primary, fontSize: 16 },
  
  orDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg },
  orLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  orText: { ...theme.typography.caption, color: theme.colors.textMuted, marginHorizontal: theme.spacing.md, fontWeight: 'bold' },
  
  inputContainer: { marginBottom: theme.spacing.md },
  label: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 8 },
  input: { height: 56, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, backgroundColor: theme.colors.white, ...theme.typography.bodyMd, color: theme.colors.text },
  
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.xl },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
  
  summaryCard: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: 4 },
  summaryValue: { ...theme.typography.labelBold, color: theme.colors.text, fontSize: 15 },
  editBtn: { ...theme.typography.labelBold, color: theme.colors.primary },
  summaryDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.md },
  
  availabilityCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.background, padding: theme.spacing.lg, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border },
  availabilityTitle: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 4 },
  availabilityDesc: { ...theme.typography.caption, color: theme.colors.textMuted },
  
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg, paddingHorizontal: theme.spacing.sm },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.border, marginRight: theme.spacing.md, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  termsText: { flex: 1, ...theme.typography.bodyMd, color: theme.colors.textMuted, lineHeight: 20 },
  
  footer: { padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.lg },
  nextBtn: { height: 56, borderRadius: theme.borderRadius.pill, justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 18 },
});
