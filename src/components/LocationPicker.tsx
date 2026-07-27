import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { getLeafletMapHTML } from '../utils/mapHTML';

interface LocationPickerProps {
  onLocationChange: (location: {
    location_lat: number;
    location_lng: number;
    location_address: string;
    location_pincode: string;
    location_city: string;
    location_state: string;
  }) => void;
}

export default function LocationPicker({ onLocationChange }: LocationPickerProps) {
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingPincode, setLoadingPincode] = useState(false);

  // Trigger onLocationChange when fields update
  useEffect(() => {
    const fullAddress = [street, area, city, state, pincode].filter(Boolean).join(', ');
    onLocationChange({
      location_lat: lat,
      location_lng: lng,
      location_address: fullAddress,
      location_city: city,
      location_state: state,
      location_pincode: pincode,
    });
  }, [lat, lng, street, area, city, state, pincode]);

  const handleGetCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      // Step 1: Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert(
          'Location Disabled',
          'Please enable location services in your phone settings.',
          [{ text: 'OK' }]
        );
        setLoadingLocation(false);
        return;
      }

      // Step 2: Request permission properly
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status === 'denied') {
        if (!canAskAgain) {
          // Permission permanently denied — send to settings
          Alert.alert(
            'Permission Required',
            'Location permission was denied. Please enable it manually in Settings → Apps → RentEase → Permissions → Location.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
        } else {
          Alert.alert(
            'Permission Denied',
            'Location permission is needed to fetch your current location.',
            [{ text: 'OK' }]
          );
        }
        setLoadingLocation(false);
        return;
      }

      if (status !== 'granted') {
        setLoadingLocation(false);
        return;
      }

      // Step 3: Get location with timeout
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLat = location.coords.latitude;
      const currentLng = location.coords.longitude;
      setLat(currentLat);
      setLng(currentLng);

      // Step 4: Reverse geocode using Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${currentLat}&lon=${currentLng}&format=json`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'RentEaseApp/1.0'
          }
        }
      );
      const data = await response.json();

      if (data && data.address) {
        setStreet(data.address.road || data.address.neighbourhood || '');
        setArea(data.address.suburb || data.address.residential || '');
        setCity(data.address.city || data.address.town || data.address.county || '');
        setState(data.address.state || '');
        setPincode(data.address.postcode || '');
      }

    } catch (error: any) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        'Could not fetch your location. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const fetchFromPincode = async () => {
    if (!pincode || pincode.length !== 6) {
      Alert.alert('Please enter a valid 6-digit pincode');
      return;
    }
    setLoadingPincode(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const po = data[0].PostOffice[0];
        setArea(po.Name || '');
        setCity(po.District || '');
        setState(po.State || '');
        
        // Approximate location using pincode via nominatim
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`);
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          setLat(parseFloat(geoData[0].lat));
          setLng(parseFloat(geoData[0].lon));
        }
      } else {
        Alert.alert('Invalid Pincode or no data found');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error fetching pincode details');
    } finally {
      setLoadingPincode(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.gpsBtn, loadingLocation && { opacity: 0.7 }]}
        onPress={handleGetCurrentLocation}
        disabled={loadingLocation}
        activeOpacity={0.8}
      >
        {loadingLocation ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <>
            <Ionicons name="location" size={20} color={theme.colors.white} />
            <Text style={styles.gpsBtnText}>Use My Current Location</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.pincodeRow}>
        <TextInput 
          style={[styles.input, { flex: 1, marginRight: theme.spacing.sm }]}
          placeholder="Enter 6-digit Pincode"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          maxLength={6}
          value={pincode}
          onChangeText={setPincode}
        />
        <TouchableOpacity 
          style={styles.fetchBtn}
          onPress={fetchFromPincode}
          disabled={loadingPincode}
        >
          {loadingPincode ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.fetchBtnText}>Fetch Address</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Street / Landmark</Text>
        <TextInput style={styles.input} value={street} onChangeText={setStreet} placeholder="Street / Landmark" placeholderTextColor={theme.colors.textMuted} />
        
        <Text style={styles.label}>Area</Text>
        <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="Area" placeholderTextColor={theme.colors.textMuted} />
        
        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={theme.colors.textMuted} />
        
        <Text style={styles.label}>State</Text>
        <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="State" placeholderTextColor={theme.colors.textMuted} />
      </View>

      {(lat !== 0 && lng !== 0) && (
        <View style={styles.mapPreviewContainer}>
          <Text style={styles.label}>Location Preview</Text>
          <View style={styles.mapWrapper}>
            <WebView
              source={{ html: getLeafletMapHTML(lat, lng, 15, 'Item Location', '#10B981') }}
              style={{ flex: 1 }}
              androidLayerType="hardware"
              scrollEnabled={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
        </View>
      )}
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
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.pill,
    gap: 8,
    ...theme.shadows.md,
  },
  gpsBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginHorizontal: theme.spacing.md,
    fontWeight: 'bold',
  },
  pincodeRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  fetchBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fetchBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
  },
  formContainer: {
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: -4,
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
  mapPreviewContainer: {
    marginTop: theme.spacing.md,
  },
  mapWrapper: {
    height: 150,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
