import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Image, Platform, ToastAndroid, Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';
import { getMultiMarkerLeafletHTML } from '../../utils/mapHTML';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'MapView'>;

export default function MapViewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapHtml, setMapHtml] = useState('');

  useEffect(() => {
    initMap();
  }, []);

  const initMap = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      let userLat = 40.7128;
      let userLng = -74.0060;
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        userLat = loc.coords.latitude;
        userLng = loc.coords.longitude;
      }

      const { data: items } = await supabase
        .from('items')
        .select('id, title, price_per_day, location_lat, location_lng')
        .eq('is_available', true)
        .not('location_lat', 'is', null);

      const fetchedItems = items || [];
      setItems(fetchedItems);

      const getMapWithItemsHTML = (
        userLat: number,
        userLng: number,
        items: any[]
      ) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>* { margin:0; padding:0; } html,body,#map { width:100%; height:100vh; }</style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${userLat}, ${userLng}], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          const userIcon = L.divIcon({
            html: '<div style="background:#10B981;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
            iconSize:[18,18], iconAnchor:[9,9], className:''
          });
          L.marker([${userLat}, ${userLng}], {icon: userIcon}).addTo(map).bindPopup('📍 You are here');
          const itemIcon = L.divIcon({
            html: '<div style="background:#EF4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
            iconSize:[16,16], iconAnchor:[8,8], className:''
          });
          const items = ${JSON.stringify(fetchedItems)};
          items.forEach(item => {
            if (item.location_lat && item.location_lng) {
              L.marker([item.location_lat, item.location_lng], {icon: itemIcon})
                .addTo(map)
                .bindPopup('<b>' + item.title + '</b><br>₹' + item.price_per_day + '/day');
            }
          });
        </script>
      </body>
      </html>
      `;

      setMapHtml(getMapWithItemsHTML(userLat, userLng, fetchedItems));
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhereAmI = async () => {
    try {
      setLoadingLocation(true);

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

      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status === 'denied') {
        if (!canAskAgain) {
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

      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc);
      const mapItems = items.map(i => ({ lat: i.location_lat, lng: i.location_lng, title: i.title }));
      setMapHtml(getMultiMarkerLeafletHTML(loc.coords.latitude, loc.coords.longitude, mapItems));
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Showing your current location 📍', ToastAndroid.SHORT);
      } else {
        Alert.alert('Showing your current location 📍');
      }
    } catch (err) {
      console.log(err);
      Alert.alert(
        'Location Error',
        'Could not fetch your location. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const getImages = (images: any): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(Boolean);
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const images = getImages(item.images);
    const imageUrl = images.length > 0 ? images[0] : null;
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ItemDetail', { item })}
        activeOpacity={0.9}
      >
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemPrice}>₹{item.price_per_day}/d</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Map View</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mapSection}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <WebView 
            source={{ html: mapHtml }} 
            style={styles.webview} 
            javaScriptEnabled={true}
            domStorageEnabled={true}
            androidLayerType="hardware"
            scrollEnabled={true}
          />
        )}

        <TouchableOpacity 
          style={[styles.whereAmIBtn, loadingLocation && { opacity: 0.7 }]} 
          onPress={handleWhereAmI}
          disabled={loadingLocation}
          activeOpacity={0.8}
        >
          {loadingLocation ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={styles.whereAmIText}>📍 Where Am I</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet List */}
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>Nearby Items</Text>
        {items.length === 0 && !loading ? (
          <Text style={styles.emptyText}>No items found in this area</Text>
        ) : (
          <FlatList
            horizontal
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.sm,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  mapSection: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  webview: { flex: 1 },
  
  bottomSheet: {
    backgroundColor: theme.colors.white,
    ...theme.shadows.lg,
    padding: theme.spacing.sm,
    paddingBottom: 24, // extra padding for safe area
  },
  sheetTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  listContent: {
    paddingHorizontal: theme.spacing.sm,
  },
  card: {
    width: 140,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    justifyContent: 'center',
  },
  itemTitle: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    ...theme.typography.labelBold,
    color: theme.colors.primary,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    paddingHorizontal: theme.spacing.sm,
  },
  whereAmIBtn: {
    position: 'absolute',
    bottom: 200,
    right: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...theme.shadows.lg,
  },
  whereAmIText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
  },
});
