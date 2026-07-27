import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'AllCategories'>;

const CATEGORY_ICONS: any = {
  'Electric Vehicles': 'car-sport',
  'Electronics': 'phone-portrait',
  'Tools': 'hammer',
  'Other': 'cube',
  'Furniture': 'bed',
  'Gadgets': 'game-controller',
};

export default function AllCategoriesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*, items(count)');
    if (data) setCategories(data);
    setLoading(false);
  };

  const renderCategory = ({ item }: { item: any }) => {
    const iconName = CATEGORY_ICONS[item.name] || 'apps';
    const itemCount = item.items && item.items[0] && item.items[0].count !== undefined ? item.items[0].count : (item.items ? item.items.length : 0);

    return (
      <TouchableOpacity 
        style={styles.categoryCard}
        onPress={() => navigation.navigate('CategoryItems', { 
          categoryId: item.id, 
          categoryName: item.name, 
          categoryColor: theme.colors.primary 
        })}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={40} color={theme.colors.primary} />
        </View>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryCount}>{itemCount} items available</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>All Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderCategory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border 
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { ...theme.typography.h3, color: theme.colors.text, fontSize: 20 },
  listContent: { padding: theme.spacing.lg },
  columnWrapper: { gap: theme.spacing.md, justifyContent: 'space-between', marginBottom: theme.spacing.md },
  categoryCard: { 
    flex: 1, 
    height: 180, 
    backgroundColor: '#F0FDF4', // soft emerald tint
    borderRadius: theme.borderRadius.xl, 
    padding: theme.spacing.lg, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    ...theme.shadows.sm
  },
  iconContainer: {
    width: 72,
    height: 72,
    backgroundColor: theme.colors.white,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  categoryName: { 
    ...theme.typography.labelBold, 
    fontSize: 16, 
    color: theme.colors.text, 
    textAlign: 'center', 
    marginBottom: 4 
  },
  categoryCount: { 
    ...theme.typography.caption, 
    color: theme.colors.textMuted, 
    textAlign: 'center' 
  },
});
