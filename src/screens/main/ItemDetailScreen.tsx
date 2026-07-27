import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking, Image, StatusBar, Platform, Share, Modal, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';
import { getLeafletMapHTML, getRouteMapHTML } from '../../utils/mapHTML';
import { ReviewSummaryCard } from '../../components/ReviewSummaryCard';

type DetailRouteProp = RouteProp<SharedStackParamList, 'ItemDetail'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'ItemDetail'>;

export default function ItemDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const [item, setItem] = useState(route.params.item);
  const [isLoading, setIsLoading] = useState(true);

  const [isSaved, setIsSaved] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [renterLat, setRenterLat] = useState<number | null>(null);
  const [renterLng, setRenterLng] = useState<number | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);

  useEffect(() => {
    fetchData();
    fetchRenterLocation();
  }, []);

  const fetchRenterLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setRenterLat(loc.coords.latitude);
        setRenterLng(loc.coords.longitude);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const fetchData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      checkSavedStatus(session.user.id);
    }
    fetchReviews();

    const { data } = await supabase
      .from('items')
      .select('*, profiles(*), images, location_lat, location_lng, location_address, location_city, location_state, location_pincode')
      .eq('id', item.id)
      .single();
    
    if (data) {
      setItem(data);
      console.log('Fetched item images:', data.images);
    }
    setIsLoading(false);
  };

  const checkSavedStatus = async (uid: string) => {
    const { data } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', uid)
      .eq('item_id', item.id)
      .single();
    if (data) setIsSaved(true);
  };

  const toggleSave = async () => {
    if (!userId) return;
    if (isSaved) {
      await supabase.from('saved_items').delete().eq('user_id', userId).eq('item_id', item.id);
      setIsSaved(false);
    } else {
      await supabase.from('saved_items').insert({ user_id: userId, item_id: item.id });
      setIsSaved(true);
    }
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('item_id', item.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setReviews(data);
  };

  const handleDeleteItem = async (itemId: string, itemTitle: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemTitle}"?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check if item has active bookings first
              const { data: activeBookings } = await supabase
                .from('bookings')
                .select('id')
                .eq('item_id', itemId)
                .in('status', ['pending', 'confirmed', 'active']);

              if (activeBookings && activeBookings.length > 0) {
                Alert.alert(
                  'Cannot Delete',
                  'This item has active or pending bookings. Please complete or cancel all bookings before deleting.',
                  [{ text: 'OK' }]
                );
                return;
              }

              // Delete item images from storage first
              const { data: itemData } = await supabase
                .from('items')
                .select('images')
                .eq('id', itemId)
                .single();

              if (itemData?.images && itemData.images.length > 0) {
                const imagePaths = itemData.images.map((url: string) => {
                  const parts = url.split('/item-images/');
                  return parts[1];
                }).filter(Boolean);

                if (imagePaths.length > 0) {
                  await supabase.storage
                    .from('item-images')
                    .remove(imagePaths);
                }
              }

              // Delete saved_items references
              await supabase
                .from('saved_items')
                .delete()
                .eq('item_id', itemId);

              // Delete the item
              const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', itemId);

              if (error) throw error;

              Alert.alert(
                '✅ Deleted',
                'Your item has been successfully deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.goBack();
                    }
                  }
                ]
              );

            } catch (error) {
              console.error('Delete item error:', error);
              Alert.alert(
                'Error',
                'Failed to delete item. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
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



  let distanceStr = '';
  let distanceBadgeBg = '';
  let distanceBadgeText = '';

  if (renterLat && renterLng && item.location_lat && item.location_lng) {
    const dist = parseFloat(getDistance(renterLat, renterLng, item.location_lat, item.location_lng));
    if (dist < 1) {
      distanceStr = `${dist} km away — Very Close! 🟢`;
      distanceBadgeBg = '#D1FAE5';
      distanceBadgeText = '#059669';
    } else if (dist <= 5) {
      distanceStr = `${dist} km away — Nearby 🟡`;
      distanceBadgeBg = '#FEF9C3';
      distanceBadgeText = '#CA8A04';
    } else if (dist <= 15) {
      distanceStr = `${dist} km away — Moderate distance 🟠`;
      distanceBadgeBg = '#FFEDD5';
      distanceBadgeText = '#EA580C';
    } else {
      distanceStr = `${dist} km away — Far 🔴`;
      distanceBadgeBg = '#FEE2E2';
      distanceBadgeText = '#DC2626';
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Edge-to-edge Hero Image */}
        <View style={[styles.heroImageContainer, { width: '100%', height: 300, backgroundColor: '#f0f0f0' }]}>
          {isLoading ? (
            <View style={{ flex: 1, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#64748B' }}>Loading...</Text>
            </View>
          ) : (() => {
            const imgs = getImages(item?.images);
            console.log('Rendering images:', imgs);
            return imgs.length > 0 ? (
              <Image 
                source={{ uri: imgs[0] }} 
                style={{ width: '100%', height: 300 }}
                resizeMode="cover"
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                onLoad={() => console.log('Image loaded successfully')}
              />
            ) : (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#D1FAE5'
              }}>
                <Text style={{ fontSize: 48 }}>📦</Text>
                <Text style={{ color: '#64748B', marginTop: 8 }}>No image available</Text>
              </View>
            );
          })()}
          {/* Top Gradient for icon visibility */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.heroTopGradient}
          />
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.priceText}>₹{item.price_per_day}<Text style={styles.priceUnit}> / day</Text></Text>
              
              {item.fraud_risk && (
                <View style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: theme.borderRadius.pill,
                  backgroundColor: item.fraud_risk === 'low' ? '#D1FAE5' : item.fraud_risk === 'medium' ? '#FEF9C3' : '#FEE2E2',
                  marginTop: 8,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: item.fraud_risk === 'low' ? '#059669' : item.fraud_risk === 'medium' ? '#CA8A04' : '#DC2626' }}>
                    {item.fraud_risk === 'low' ? '✅ Verified Listing' : item.fraud_risk === 'medium' ? '⚠️ Review Carefully' : '🚨 Suspicious Listing'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={16} color={theme.colors.primary} />
              <Text style={styles.metaText}>{item.location_name || 'Location unknown'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.metaText}>{Number(item.rating || 0).toFixed(1)} ({reviews.length} reviews)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Owner Card */}
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerInitials}>{item.profiles?.full_name?.charAt(0) || 'O'}</Text>
            </View>
            <View style={styles.ownerDetails}>
              <Text style={styles.ownerName}>{item.profiles?.full_name || 'Owner'}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Verified Owner</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.messageBtn}>
              <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Location Card UI */}
          <View style={styles.locationCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <Text style={{ ...theme.typography.h3, color: theme.colors.text, marginLeft: 8 }}>
                Item Location
              </Text>
            </View>
            
            {item.location_address ? (
              <Text style={{ ...theme.typography.bodySm, color: theme.colors.textMuted, marginBottom: 4 }}>
                {item.location_address}
              </Text>
            ) : null}
            {item.location_city || item.location_state || item.location_pincode ? (
              <Text style={{ ...theme.typography.bodySm, color: theme.colors.textMuted, marginBottom: 12 }}>
                {[item.location_city, item.location_state].filter(Boolean).join(', ')} {item.location_pincode ? `— ${item.location_pincode}` : ''}
              </Text>
            ) : null}

            {distanceStr !== '' && (
              <View style={{ backgroundColor: distanceBadgeBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.pill, alignSelf: 'flex-start', marginBottom: 16 }}>
                <Text style={{ ...theme.typography.labelBold, color: distanceBadgeText }}>
                  🛵 {distanceStr}
                </Text>
              </View>
            )}

            {item.location_lat && item.location_lng ? (
              <View style={{
                height: 180,
                borderRadius: theme.borderRadius.lg,
                overflow: 'hidden',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: theme.colors.border
              }}>
                <WebView
                  source={{ html: getLeafletMapHTML(Number(item.location_lat), Number(item.location_lng), 15, item.title || 'Item Location', '#10B981') }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  androidLayerType="hardware"
                />
              </View>
            ) : (
              <View style={{
                height: 100,
                backgroundColor: theme.colors.primaryLight || '#E0F2FE',
                borderRadius: theme.borderRadius.lg,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Text style={{ color: theme.colors.textMuted }}>📍 No location set for this item</Text>
              </View>
            )}

            {item.location_lat && item.location_lng ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={styles.locationActionBtn}
                  onPress={() => setShowRouteModal(true)}
                >
                  <Text style={styles.locationActionBtnText}>🧭 Get Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.locationActionBtn}
                  onPress={() => Share.share({ message: `Item location: ${item.location_address || item.location_name}\nhttps://maps.google.com/?q=${item.location_lat},${item.location_lng}` })}
                >
                  <Text style={styles.locationActionBtnText}>📤 Share Location</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={styles.divider} />

          {/* About */}
          <Text style={styles.sectionTitle}>About this item</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>

          {/* Specs Grid */}
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specsGrid}>
            <View style={styles.specBox}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.textMuted} />
              <Text style={styles.specLabel}>Condition</Text>
              <Text style={styles.specValue}>{item.condition || 'Good'}</Text>
            </View>
            <View style={styles.specBox}>
              <Ionicons name="grid-outline" size={20} color={theme.colors.textMuted} />
              <Text style={styles.specLabel}>Category</Text>
              <Text style={styles.specValue}>{item.categories?.name || 'Other'}</Text>
            </View>
            <View style={styles.specBox}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
              <Text style={styles.specLabel}>Min Days</Text>
              <Text style={styles.specValue}>1 Day</Text>
            </View>
            <View style={styles.specBox}>
              <Ionicons name="infinite-outline" size={20} color={theme.colors.textMuted} />
              <Text style={styles.specLabel}>Max Days</Text>
              <Text style={styles.specValue}>30 Days</Text>
            </View>
          </View>

          {/* Availability Calendar Strip placeholder */}
          <Text style={styles.sectionTitle}>Availability</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarStrip}>
            {[...Array(7)].map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <View key={i} style={[styles.dayBox, isWeekend && styles.dayBoxDisabled]}>
                  <Text style={[styles.dayName, isWeekend && styles.dayNameDisabled]}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                  </Text>
                  <Text style={[styles.dayNumber, isWeekend && styles.dayNumberDisabled]}>
                    {date.getDate()}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Reviews section */}
          <Text style={styles.sectionTitle}>Reviews</Text>

          <ReviewSummaryCard itemId={item.id} />
          {reviews.length > 0 ? (
            reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{r.profiles?.full_name}</Text>
                  <View style={{flexDirection: 'row'}}><Ionicons name="star" size={12} color="#F59E0B" /><Text style={{fontSize: 12, marginLeft: 4}}>{r.rating}</Text></View>
                </View>
                <Text style={styles.reviewText}>{r.comment}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No reviews yet.</Text>
          )}

          {userId === item?.owner_id && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(item.id, item.title)}
            >
              <Text style={styles.deleteButtonText}>🗑️ Delete Item</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating Header Buttons */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.floatingBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingBtn} onPress={toggleSave}>
          <Ionicons name={isSaved ? "heart" : "heart-outline"} size={24} color={isSaved ? theme.colors.error : theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Sticky Bottom Bar */}
      {userId !== item?.owner_id && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomPriceInfo}>
            <Text style={styles.bottomPriceText}>₹{item.price_per_day}</Text>
            <Text style={styles.bottomPriceUnit}>/day</Text>
          </View>
          <TouchableOpacity 
            style={styles.bookBtnContainer}
            onPress={() => navigation.navigate('BookingRequest', { item })}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookBtn}
            >
              <Text style={styles.bookBtnText}>Book Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showRouteModal} animationType="slide" onRequestClose={() => setShowRouteModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.white }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
            <Text style={{ ...theme.typography.h3 }}>Route Map</Text>
            <TouchableOpacity onPress={() => setShowRouteModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            {renterLat && renterLng ? (
              <WebView
                source={{ html: getRouteMapHTML(renterLat, renterLng, item.location_lat, item.location_lng) }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                androidLayerType="hardware"
              />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ ...theme.typography.bodyMd, color: theme.colors.textMuted }}>Fetching your location...</Text>
              </View>
            )}
          </View>
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <TouchableOpacity 
              style={[styles.bookBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                const url = (renterLat && renterLng) 
                  ? `https://maps.google.com/maps?saddr=${renterLat},${renterLng}&daddr=${item.location_lat},${item.location_lng}`
                  : `https://maps.google.com/?q=${item.location_lat},${item.location_lng}`;
                Linking.openURL(url);
              }}
            >
              <Text style={styles.bookBtnText}>Open in Google Maps app</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  scrollContent: { flex: 1 },
  heroImageContainer: { width: '100%', height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  placeholderImage: { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  heroTopGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  floatingHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  floatingBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.white, justifyContent: 'center', alignItems: 'center', ...theme.shadows.sm },
  contentContainer: { flex: 1, backgroundColor: theme.colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, padding: theme.spacing.lg },
  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md },
  title: { ...theme.typography.h2, fontSize: 24, color: theme.colors.text, marginBottom: 8 },
  priceText: { ...theme.typography.h2, color: theme.colors.primary },
  priceUnit: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: theme.spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.lg },
  ownerCard: { flexDirection: 'row', alignItems: 'center' },
  ownerAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  ownerInitials: { ...theme.typography.h3, color: theme.colors.primary },
  ownerDetails: { flex: 1, marginLeft: 12 },
  ownerName: { ...theme.typography.labelBold, fontSize: 16, color: theme.colors.text, marginBottom: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { ...theme.typography.caption, color: '#10B981', fontWeight: 'bold' },
  messageBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { ...theme.typography.h3, fontSize: 18, color: theme.colors.text, marginBottom: theme.spacing.md },
  descriptionText: { ...theme.typography.bodyMd, color: theme.colors.textMuted, lineHeight: 24, marginBottom: theme.spacing.xl },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.xl },
  specBox: { width: '48%', backgroundColor: theme.colors.background, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
  specLabel: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: 8, marginBottom: 4 },
  specValue: { ...theme.typography.labelBold, color: theme.colors.text },
  calendarStrip: { flexDirection: 'row', marginBottom: theme.spacing.xl },
  dayBox: { width: 64, height: 80, backgroundColor: theme.colors.primary + '10', borderRadius: theme.borderRadius.lg, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: theme.colors.primary + '30' },
  dayBoxDisabled: { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
  dayName: { ...theme.typography.caption, color: theme.colors.primary, marginBottom: 8, fontWeight: 'bold' },
  dayNameDisabled: { color: theme.colors.textMuted },
  dayNumber: { ...theme.typography.h3, color: theme.colors.primary },
  dayNumberDisabled: { color: theme.colors.textMuted },
  reviewCard: { backgroundColor: theme.colors.background, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.md },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewerName: { ...theme.typography.labelBold, color: theme.colors.text },
  reviewText: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  emptyText: { ...theme.typography.bodyMd, color: theme.colors.textMuted, fontStyle: 'italic' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border, ...theme.shadows.lg },
  bottomPriceInfo: { flex: 1 },
  bottomPriceText: { ...theme.typography.h2, color: theme.colors.text },
  bottomPriceUnit: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  bookBtnContainer: { flex: 1.5 },
  bookBtn: { height: 52, borderRadius: theme.borderRadius.pill, justifyContent: 'center', alignItems: 'center' },
  bookBtnText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 16 },
  locationCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  locationActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '05',
  },
  locationActionBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.primary,
  },
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Manrope',
  },
});
