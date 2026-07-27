import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type CategoryRouteProp = RouteProp<SharedStackParamList, 'CategoryItems'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'CategoryItems'>;

export default function CategoryItemsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CategoryRouteProp>();
  const { categoryId, categoryName } = route.params;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('Newest');

  useEffect(() => {
    fetchItems();
  }, [sortBy]);

  const fetchItems = async () => {
    let query = supabase
      .from('items')
      .select('*, profiles(full_name, avatar_url), categories(name, icon, color)')
      .eq('category_id', categoryId)
      .eq('is_available', true);

    if (sortBy === 'Newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'Price↑') {
      query = query.order('price_per_day', { ascending: true });
    } else if (sortBy === 'Price↓') {
      query = query.order('price_per_day', { ascending: false });
    }

    const { data } = await query;
    if (data) setItems(data);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, [sortBy]);

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

  const renderItemCard = ({ item }: { item: any }) => {
    const images = getImages(item.images);
    const imageUrl = images.length > 0 ? images[0] : null;
    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => navigation.navigate('ItemDetail', { item })}
        activeOpacity={0.8}
      >
        <View style={styles.cardImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={32} color={theme.colors.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.itemName} numberOfLines={1}>{item.title}</Text>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{Number(item.rating || 0).toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.itemLocation} numberOfLines={1}>📍 {item.location_name}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.itemPrice}>₹{item.price_per_day}<Text style={styles.itemPriceUnit}>/d</Text></Text>
            <View style={styles.distanceBox}>
              <Text style={styles.distanceText}>{Math.floor(Math.random() * 10 + 1)} km away</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{categoryName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.countText}>{items.length} items found</Text>
        <View style={styles.sortRow}>
          {['Newest', 'Price↑', 'Price↓'].map((sort) => (
            <TouchableOpacity 
              key={sort}
              style={[styles.sortChip, sortBy === sort && styles.sortChipActive]}
              onPress={() => { setLoading(true); setSortBy(sort); }}
            >
              <Text style={[styles.sortChipText, sortBy === sort && styles.sortChipTextActive]}>{sort}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptySubtitle}>Be the first to list an item in this category!</Text>
          <TouchableOpacity style={styles.listBtn} onPress={() => navigation.navigate('AddItemStep1', {})}>
            <Text style={styles.listBtnText}>List an Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItemCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { ...theme.typography.h3, color: theme.colors.text, fontSize: 20 },
  subHeader: { 
    padding: theme.spacing.md, 
    backgroundColor: theme.colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg
  },
  countText: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  sortRow: { flexDirection: 'row', gap: 8 },
  sortChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.borderRadius.pill, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  sortChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sortChipText: { ...theme.typography.labelBold, color: theme.colors.text },
  sortChipTextActive: { color: theme.colors.white },
  listContent: { padding: theme.spacing.lg, gap: theme.spacing.md },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: 12,
    ...theme.shadows.sm,
  },
  cardImageContainer: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  cardImage: { width: '100%', height: '100%' },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  cardContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { flex: 1, ...theme.typography.labelBold, fontSize: 16, color: theme.colors.text, marginRight: 8 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingText: { ...theme.typography.caption, color: '#D97706', fontWeight: 'bold', marginLeft: 2 },
  itemLocation: { ...theme.typography.caption, color: theme.colors.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { ...theme.typography.labelBold, fontSize: 18, color: theme.colors.primary },
  itemPriceUnit: { ...theme.typography.caption, color: theme.colors.textMuted },
  distanceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  distanceText: { ...theme.typography.caption, color: theme.colors.textMuted },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: theme.spacing.md },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 4 },
  emptySubtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted, marginBottom: 24, textAlign: 'center' },
  listBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: theme.borderRadius.pill, ...theme.shadows.sm },
  listBtnText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 16 },
});
