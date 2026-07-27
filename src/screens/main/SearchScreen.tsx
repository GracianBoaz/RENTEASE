import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';
import { askGemini } from '../../utils/gemini';
import { AILoadingSpinner } from '../../components/AILoadingSpinner';
import { SmartChip } from '../../components/SmartChip';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'SearchMain'>;

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'price_asc', label: 'Price ↑' },
  { id: 'price_desc', label: 'Price ↓' },
  { id: 'top_rated', label: 'Top Rated' },
];

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSort, setSelectedSort] = useState('newest');
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').limit(10);
    if (data) setCategories(data);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchResults();
  }, [debouncedQuery, selectedCategory, selectedSort]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('items')
        .select('*, profiles(full_name), categories(name)')
        .eq('is_available', true);

      if (debouncedQuery) {
        query = query.ilike('title', `%${debouncedQuery}%`);
      }
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      switch (selectedSort) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price_asc':
          query = query.order('price_per_day', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price_per_day', { ascending: false });
          break;
        case 'top_rated':
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSearch = async (input: string) => {
    if (!input.trim()) return;
    setAnalyzing(true);
    try {
      const prompt = `
        User search query: "${input}"
        
        Extract:
        1. Category (EV/Electronics/Tools/Other)
        2. Item type
        3. Features
        4. Use case
        
        Return JSON:
        {
          "category": "string",
          "itemType": "string",
          "features": ["array"],
          "suggestions": ["item1", "item2"]
        }
      `;
      
      const response = await askGemini(prompt);
      if (response) {
        const parsed = JSON.parse(response);
        setAiAnalysis(parsed);
        filterItems(parsed);
      }
    } catch (error) {
      console.error('Search analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const filterItems = (analysis: any) => {
    if (analysis.category) {
      const matchedCat = categories.find(c => c.name.toLowerCase().includes(analysis.category.toLowerCase()));
      if (matchedCat) setSelectedCategory(matchedCat.id);
    }
    if (analysis.itemType) {
      setSearchQuery(analysis.itemType);
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
          <Text style={styles.itemCategory}>{item.categories?.name}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.itemPrice}>₹{item.price_per_day}<Text style={styles.itemPriceUnit}>/d</Text></Text>
            <View style={styles.distanceBox}>
              <Ionicons name="location" size={12} color={theme.colors.textMuted} />
              <Text style={styles.distanceText}>{Math.floor(Math.random() * 10 + 1)} km</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="i need tool to drill..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => analyzeSearch(searchQuery)}
          />
          <TouchableOpacity 
            onPress={() => analyzeSearch(searchQuery)}
            style={styles.searchButton}
          >
            <Text>🔍</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {analyzing && <AILoadingSpinner message="Analyzing your search..." />}

      {aiAnalysis && !analyzing && (
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisLabel}>Category: {aiAnalysis.category}</Text>
          <Text style={styles.analysisLabel}>Item: {aiAnalysis.itemType}</Text>
          
          <Text style={styles.suggestionsTitle}>Suggestions:</Text>
          <View style={styles.suggestionsRow}>
            {aiAnalysis.suggestions?.map((s: string, idx: number) => (
              <SmartChip
                key={idx}
                label={s}
                onPress={() => setSearchQuery(s)}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
          {SORT_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, selectedSort === item.id && styles.chipActive]}
              onPress={() => setSelectedSort(item.id)}
            >
              <Text style={[styles.chipText, selectedSort === item.id && styles.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.chipDivider} />
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, selectedCategory === item.id && styles.chipActive]}
              onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
            >
              <Text style={[styles.chipText, selectedCategory === item.id && styles.chipTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your keywords or filters to find what you're looking for.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItemCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity 
        style={styles.mapViewBtn} 
        onPress={() => navigation.navigate('MapView')}
      >
        <Ionicons name="map" size={24} color={theme.colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'android' ? theme.spacing.xl : theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.pill,
    height: 48,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...theme.typography.bodyMd,
    color: theme.colors.text,
  },
  searchButton: {
    padding: 4,
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filtersSection: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  chipContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginHorizontal: 4,
  },
  resultsContainer: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.xl },
  emptyIcon: { fontSize: 64, marginBottom: theme.spacing.md },
  emptyTitle: { ...theme.typography.h2, fontSize: 24, color: theme.colors.text, marginBottom: 8 },
  emptySubtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 24 },
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
  itemCategory: { ...theme.typography.caption, color: theme.colors.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { ...theme.typography.labelBold, fontSize: 18, color: theme.colors.primary },
  itemPriceUnit: { ...theme.typography.caption, color: theme.colors.textMuted },
  distanceBox: { flexDirection: 'row', alignItems: 'center' },
  distanceText: { ...theme.typography.caption, color: theme.colors.textMuted, marginLeft: 2 },
  mapViewBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? theme.spacing.xl + 64 : theme.spacing.md + 64, // Positioned below header
    right: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    ...theme.shadows.md,
    zIndex: 10,
  },
  analysisContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  analysisLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  suggestionsTitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
});
