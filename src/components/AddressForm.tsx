import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { getLeafletMapHTML } from '../utils/mapHTML';
import { supabase } from '../utils/supabase';
import { UserAddress } from './AddressManager';

interface AddressFormProps {
  onAddressSelected: (address: UserAddress) => void;
  onSave: (address: UserAddress) => void;
  onCancel?: () => void;
  initialValues?: UserAddress;
}

export default function AddressForm({ onAddressSelected, onSave, onCancel, initialValues }: AddressFormProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [mobile, setMobile] = useState(initialValues?.mobile || '');
  const [flatHouseNo, setFlatHouseNo] = useState(initialValues?.flat_house_no || '');
  const [area, setArea] = useState(initialValues?.area_street_village || '');
  const [landmark, setLandmark] = useState(initialValues?.landmark || '');
  const [pincode, setPincode] = useState(initialValues?.pincode || '');
  const [city, setCity] = useState(initialValues?.town_city || '');
  const [state, setState] = useState(initialValues?.state || '');
  const [lat, setLat] = useState<number>(initialValues?.location_lat || 0);
  const [lng, setLng] = useState<number>(initialValues?.location_lng || 0);
  const [isDefault, setIsDefault] = useState(initialValues?.is_default || false);

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pincode.length === 6) {
      fetchFromPincode();
    }
  }, [pincode]);

  const fetchFromPincode = async () => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setCity(po.District || '');
        setState(po.State || '');
      }
    } catch (error) {
      console.error('Pincode fetch error:', error);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to fetch your current location.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLat(location.coords.latitude);
      setLng(location.coords.longitude);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Could not fetch your location.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) return 'Name is required';
    if (!mobile.trim() || mobile.length < 10) return 'Valid 10-digit mobile number is required';
    if (!flatHouseNo.trim()) return 'Flat/House No is required';
    if (!area.trim()) return 'Area/Street is required';
    if (!pincode.trim() || pincode.length !== 6) return 'Valid 6-digit Pincode is required';
    if (!city.trim()) return 'Town/City is required';
    if (!state.trim()) return 'State is required';
    return null;
  };

  const buildAddressObject = (): UserAddress => ({
    id: initialValues?.id,
    name: name.trim(),
    mobile: mobile.trim(),
    flat_house_no: flatHouseNo.trim(),
    area_street_village: area.trim(),
    landmark: landmark.trim(),
    pincode: pincode.trim(),
    town_city: city.trim(),
    state: state.trim(),
    location_lat: lat || undefined,
    location_lng: lng || undefined,
    is_default: isDefault,
  });

  const handleSaveAndUse = async () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      Alert.alert('Validation Error', errorMsg);
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const addressData = buildAddressObject();
      addressData.user_id = session.user.id;

      // If setting as default, we might want to unset others (handled by DB triggers ideally, but let's just save for now)
      
      let result;
      if (addressData.id) {
        result = await supabase.from('user_addresses').update(addressData).eq('id', addressData.id).select().single();
      } else {
        result = await supabase.from('user_addresses').insert(addressData).select().single();
      }

      if (result.error) throw result.error;
      
      onSave(result.data);
    } catch (error: any) {
      console.error('Save address error:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUseWithoutSaving = () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      Alert.alert('Validation Error', errorMsg);
      return;
    }
    onAddressSelected(buildAddressObject());
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{initialValues ? 'Edit Address' : 'Add New Address'}</Text>
        {onCancel && (
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput 
        style={styles.input} 
        value={name} 
        onChangeText={setName} 
        placeholder="Full Name" 
        placeholderTextColor={theme.colors.textMuted} 
      />

      <Text style={styles.label}>Mobile Number</Text>
      <TextInput 
        style={styles.input} 
        value={mobile} 
        onChangeText={setMobile} 
        placeholder="Mobile Number" 
        keyboardType="numeric" 
        maxLength={10}
        placeholderTextColor={theme.colors.textMuted} 
      />

      <TouchableOpacity 
        style={[styles.gpsBtn, loadingLocation && { opacity: 0.7 }]}
        onPress={handleGetCurrentLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <>
            <Ionicons name="location" size={20} color={theme.colors.white} />
            <Text style={styles.gpsBtnText}>📍 Use My Current Location</Text>
          </>
        )}
      </TouchableOpacity>

      {(lat !== 0 && lng !== 0) && (
        <View style={styles.mapWrapper}>
          <WebView
            source={{ html: getLeafletMapHTML(lat, lng, 15, 'Selected Location', '#10B981') }}
            style={{ flex: 1 }}
            scrollEnabled={false}
          />
        </View>
      )}

      <Text style={styles.label}>Flat / House No</Text>
      <TextInput 
        style={styles.input} 
        value={flatHouseNo} 
        onChangeText={setFlatHouseNo} 
        placeholder="Flat, House No, Building" 
        placeholderTextColor={theme.colors.textMuted} 
      />

      <Text style={styles.label}>Area, Street, Village</Text>
      <TextInput 
        style={styles.input} 
        value={area} 
        onChangeText={setArea} 
        placeholder="Area, Street, Village" 
        placeholderTextColor={theme.colors.textMuted} 
      />

      <Text style={styles.label}>Landmark</Text>
      <TextInput 
        style={styles.input} 
        value={landmark} 
        onChangeText={setLandmark} 
        placeholder="Landmark (Optional)" 
        placeholderTextColor={theme.colors.textMuted} 
      />

      <Text style={styles.label}>Pincode</Text>
      <TextInput 
        style={styles.input} 
        value={pincode} 
        onChangeText={setPincode} 
        placeholder="6-digit Pincode" 
        keyboardType="numeric"
        maxLength={6}
        placeholderTextColor={theme.colors.textMuted} 
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Town/City</Text>
          <TextInput 
            style={styles.input} 
            value={city} 
            onChangeText={setCity} 
            placeholder="City" 
            placeholderTextColor={theme.colors.textMuted} 
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>State</Text>
          <TextInput 
            style={styles.input} 
            value={state} 
            onChangeText={setState} 
            placeholder="State" 
            placeholderTextColor={theme.colors.textMuted} 
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.checkboxRow}
        onPress={() => setIsDefault(!isDefault)}
      >
        <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
          {isDefault && <Ionicons name="checkmark" size={14} color={theme.colors.white} />}
        </View>
        <Text style={styles.checkboxText}>Set as default address</Text>
      </TouchableOpacity>

      <View style={styles.footerBtns}>
        <TouchableOpacity 
          style={styles.saveBtn}
          onPress={handleSaveAndUse}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.saveBtnText}>Save & Use This Address</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.outlineBtn}
          onPress={handleUseWithoutSaving}
          disabled={saving}
        >
          <Text style={styles.outlineBtnText}>Use Without Saving</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 18,
  },
  label: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
    marginBottom: 4,
    marginTop: theme.spacing.sm,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.bodyMd,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  row: {
    flexDirection: 'row',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.pill,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  gpsBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
  },
  mapWrapper: {
    height: 120,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxText: {
    ...theme.typography.bodyMd,
    color: theme.colors.text,
  },
  footerBtns: {
    gap: 12,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 48,
    borderRadius: theme.borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
  },
  outlineBtn: {
    height: 48,
    borderRadius: theme.borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  outlineBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.primary,
  },
});
