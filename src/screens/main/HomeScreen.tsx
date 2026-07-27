import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput, ScrollView, RefreshControl, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';
import * as Location from 'expo-location';
import { SmartRecommendations } from '../../components/SmartRecommendations';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'HomeMain'>;

const CATEGORY_ICONS: any = {
  'Electric Vehicles': 'car-sport-outline',
  'Electronics': 'phone-portrait-outline',
  'Tools': 'hammer-outline',
  'Other': 'cube-outline',
  'Furniture': 'bed-outline',
  'Gadgets': 'game-controller-outline',
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [nearYouItems, setNearYouItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Explorer');
  const [userLocation, setUserLocation] = useState('Fetching...');

  useEffect(() => {
    fetchData();
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation('Location unavailable');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const { latitude, longitude } = location.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'RentEaseApp/1.0' } }
      );
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || 'Your City';
      const state = data.address?.state || '';
      setUserLocation(`${city}, ${state}`);
    } catch (error) {
      setUserLocation('');
    }
  };

  const fetchData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userData.user.id).single();
        if (profile?.full_name) {
          setUserName(profile.full_name.split(' ')[0]);
        }
      }

      const [catsResponse, itemsResponse] = await Promise.all([
        supabase.from('categories').select('*').limit(6),
        supabase.from('items').select('*, categories(name)').eq('is_available', true).order('created_at', { ascending: false }).limit(10),
      ]);

      if (catsResponse.data) setCategories(catsResponse.data);
      if (itemsResponse.data) {
        setFeaturedItems(itemsResponse.data.slice(0, 5));
        setNearYouItems(itemsResponse.data.slice(5, 10));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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

  const renderFeaturedCard = ({ item }: { item: any }) => {
    const images = getImages(item.images);
    const imageUrl = images.length > 0 ? images[0] : null;
    return (
      <TouchableOpacity 
        style={styles.featuredCard} 
        onPress={() => navigation.navigate('ItemDetail', { item })}
        activeOpacity={0.9}
      >
        <View style={styles.featuredImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.featuredImage} />
          ) : (
            <View style={[styles.featuredImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={40} color={theme.colors.textMuted} />
            </View>
          )}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>₹{item.price_per_day}/day</Text>
          </View>
        </View>
        <View style={styles.featuredContent}>
          <View style={styles.featuredHeaderRow}>
            <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{Number(item.rating || 0).toFixed(1)}</Text>
            </View>
          </View>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color={theme.colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>{item.location_name || 'Location unavailable'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNearYouCard = ({ item }: { item: any }) => {
    const images = getImages(item.images);
    const imageUrl = images.length > 0 ? images[0] : null;
    return (
      <TouchableOpacity 
        style={styles.nearYouCard} 
        onPress={() => navigation.navigate('ItemDetail', { item })}
        activeOpacity={0.8}
      >
        <View style={styles.nearYouImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.nearYouImage} />
          ) : (
            <View style={[styles.nearYouImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={24} color={theme.colors.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.nearYouContent}>
          <Text style={styles.nearYouTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.nearYouCategory}>{item.categories?.name}</Text>
          <View style={styles.nearYouFooter}>
            <Text style={styles.nearYouPrice}>₹{item.price_per_day}<Text style={styles.nearYouPriceUnit}>/d</Text></Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{Number(item.rating || 0).toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}, {userName} 👋</Text>
          <View style={styles.headerLocation}>
            <Ionicons name="location" size={14} color={theme.colors.primary} />
            <Text style={styles.headerLocationText}>{userLocation}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            style={styles.bellBtn}
            onPress={() => navigation.navigate('AIAssistant')}
          >
            <Text style={{ fontSize: 24 }}>🤖</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar} 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('SearchMain')}
        >
          <Ionicons name="search" size={20} color={theme.colors.primary} style={styles.searchIcon} />
          <Text style={styles.searchText}>Find vehicles, tools, gadgets...</Text>
          <View style={styles.filterBtn}>
            <Ionicons name="options" size={20} color={theme.colors.white} />
          </View>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllCategories')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {categories.map((cat) => {
            const iconName = CATEGORY_ICONS[cat.name] || 'apps-outline';
            return (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryChip}
                onPress={() => navigation.navigate('CategoryItems', { categoryId: cat.id, categoryName: cat.name, categoryColor: theme.colors.primary })}
              >
                <View style={styles.categoryIconContainer}>
                  <Ionicons name={iconName} size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.categoryText}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured Listings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Listings</Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={featuredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFeaturedCard}
          contentContainerStyle={styles.featuredList}
          snapToInterval={280 + 16}
          decelerationRate="fast"
          ListEmptyComponent={
            <Text style={styles.emptyText}>No featured items available right now.</Text>
          }
        />

        {/* Smart Recommendations */}
        <SmartRecommendations 
          onItemPress={(item: any) => 
            navigation.navigate('ItemDetail', { item })
          } 
        />

        {/* Near You */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Near You</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MapView')}>
            <Text style={styles.seeAll}>Map View</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.nearYouList}>
          {nearYouItems.length > 0 ? (
            nearYouItems.map((item) => (
              <View key={item.id}>{renderNearYouCard({ item })}</View>
            ))
          ) : (
            <Text style={styles.emptyText}>No items found near your location.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'android' ? theme.spacing.xl : theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    zIndex: 10,
  },
  greeting: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLocationText: {
    ...theme.typography.labelBold,
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
    borderWidth: 1,
    borderColor: theme.colors.white,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    height: 56,
    borderRadius: theme.borderRadius.pill,
    paddingLeft: theme.spacing.md,
    paddingRight: 6,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)', // subtle emerald border
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchText: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    fontSize: 20,
    color: theme.colors.text,
  },
  seeAll: {
    ...theme.typography.labelBold,
    color: theme.colors.primary,
  },
  categoriesList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.pill,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
    paddingRight: 8,
  },
  featuredList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  featuredCard: {
    width: 280,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  featuredImageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
  },
  priceBadgeText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
  },
  featuredContent: {
    padding: theme.spacing.md,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  featuredTitle: {
    flex: 1,
    ...theme.typography.h3,
    fontSize: 18,
    color: theme.colors.text,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    ...theme.typography.caption,
    color: '#D97706',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginLeft: 4,
    flex: 1,
  },
  nearYouList: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  nearYouCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 10,
    ...theme.shadows.sm,
  },
  nearYouImageContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  nearYouImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background,
  },
  nearYouContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'space-between',
  },
  nearYouTitle: {
    ...theme.typography.labelBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  nearYouCategory: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  nearYouFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nearYouPrice: {
    ...theme.typography.labelBold,
    color: theme.colors.primary,
    fontSize: 16,
  },
  nearYouPriceUnit: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: theme.spacing.lg,
  },
});
