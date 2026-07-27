import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'SavedItems'>;

export default function SavedItemsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUserId(data.session.user.id);
        fetchSavedItems(data.session.user.id);
      }
    });
  }, []);

  const fetchSavedItems = async (uid: string) => {
    const { data } = await supabase
      .from('saved_items')
      .select('*, items(*, profiles(full_name), categories(name))')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    
    if (data) setSavedItems(data);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userId) fetchSavedItems(userId);
  }, [userId]);

  const removeSavedItem = async (itemId: string) => {
    if (!userId) return;
    setSavedItems((prev) => prev.filter((si) => si.item_id !== itemId));
    await supabase.from('saved_items').delete().eq('user_id', userId).eq('item_id', itemId);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Saved Items ❤️</Text>
        <View style={{ width: 60 }} />
      </View>

      {savedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>❤️</Text>
          <Text style={styles.emptyTitle}>No saved items yet</Text>
          <Text style={styles.emptySubtitle}>Browse items and tap ❤️ to save them</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SearchMain')}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.browseBtn}>
              <Text style={styles.browseBtnText}>Browse Items</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedItems}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const actualItem = item.items;
            if (!actualItem) return null;
            return (
              <TouchableOpacity style={styles.itemCard} onPress={() => navigation.navigate('ItemDetail', { item: actualItem })}>
                <View style={styles.cardHeader}>
                  <Text style={styles.itemName}>{actualItem.title}</Text>
                  <TouchableOpacity style={styles.heartBtn} onPress={() => removeSavedItem(actualItem.id)}>
                    <Text style={styles.heartIcon}>❤️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemPrice}>₹{actualItem.price_per_day}/day</Text>
                <Text style={styles.itemCategory}>{actualItem.categories?.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { ...theme.typography.labelBold, color: theme.colors.text },
  title: { ...theme.typography.h3, color: theme.colors.text },
  listContent: { padding: theme.spacing.lg },
  itemCard: { backgroundColor: theme.colors.white, padding: theme.spacing.md, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.sm, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { ...theme.typography.bodyMd, color: theme.colors.text, flex: 1 },
  heartBtn: { padding: theme.spacing.xs },
  heartIcon: { fontSize: 20 },
  itemPrice: { ...theme.typography.labelBold, color: theme.colors.primary, marginTop: theme.spacing.xs },
  itemCategory: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: theme.spacing.md },
  emptyTitle: { ...theme.typography.h2, color: theme.colors.text, marginBottom: theme.spacing.xs },
  emptySubtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.xl },
  browseBtn: { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.lg },
  browseBtnText: { ...theme.typography.labelBold, color: theme.colors.white },
});
