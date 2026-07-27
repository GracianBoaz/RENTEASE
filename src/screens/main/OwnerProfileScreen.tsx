import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type OwnerRouteProp = RouteProp<SharedStackParamList, 'OwnerProfile'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'OwnerProfile'>;

export default function OwnerProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OwnerRouteProp>();
  const { ownerId } = route.params;

  const [owner, setOwner] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerData();
  }, [ownerId]);

  const fetchOwnerData = async () => {
    try {
      const { data: ownerData } = await supabase.from('profiles').select('*').eq('id', ownerId).single();
      const { data: ownerItems } = await supabase.from('items').select('*, categories(icon)').eq('owner_id', ownerId).eq('is_available', true).limit(10);
      
      let reviewsData: any[] = [];
      if (ownerItems && ownerItems.length > 0) {
        const itemIds = ownerItems.map(i => i.id);
        const { data } = await supabase.from('reviews').select('*, profiles!reviewer_id(full_name)').in('item_id', itemIds).limit(5);
        if (data) reviewsData = data;
      }

      setOwner(ownerData);
      setItems(ownerItems || []);
      setReviews(reviewsData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : 'New';

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
        <Text style={styles.title}>Owner Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <LinearGradient colors={['#6C3FE8', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(owner?.full_name)}</Text>
          </View>
          <Text style={styles.ownerName}>{owner?.full_name}</Text>
          <Text style={styles.verifiedText}>✅ Verified Owner</Text>
          <Text style={styles.memberSince}>Member since: {owner?.created_at ? new Date(owner.created_at).getFullYear() : '2025'}</Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Items Listed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Response Rate</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Listings</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={items}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.compactCard} onPress={() => navigation.navigate('ItemDetail', { item })}>
                <Text style={styles.itemIcon}>{item.categories?.icon}</Text>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemPrice}>₹{item.price_per_day}/day</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What renters say</Text>
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>No reviews yet.</Text>
          ) : (
            reviews.map((r, idx) => (
              <View key={idx} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{r.profiles?.full_name}</Text>
                  <Text style={styles.stars}>{'⭐'.repeat(r.rating)}</Text>
                </View>
                <Text style={styles.reviewComment}>{r.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.messageBtn} onPress={() => navigation.navigate('Chat', { otherId: ownerId, itemId: '', otherName: owner?.full_name, itemTitle: 'General Inquiry' })}>
          <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGrad}>
            <Text style={styles.messageBtnText}>💬 Send Message</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => {}}>
          <Text style={styles.outlineBtnText}>📋 View All Listings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { ...theme.typography.labelBold, color: theme.colors.text },
  title: { ...theme.typography.h3, color: theme.colors.text },
  content: { flex: 1 },
  profileHeader: { alignItems: 'center', paddingVertical: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 3, borderColor: theme.colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { ...theme.typography.h2, color: theme.colors.white },
  ownerName: { ...theme.typography.h2, color: theme.colors.white, marginBottom: 4 },
  verifiedText: { ...theme.typography.labelBold, color: '#4CAF50', backgroundColor: theme.colors.white, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  memberSince: { ...theme.typography.caption, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12, marginTop: -24 },
  statCard: { flex: 1, backgroundColor: theme.colors.white, padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  statValue: { ...theme.typography.h3, color: theme.colors.primary, marginBottom: 4 },
  statLabel: { ...theme.typography.caption, color: theme.colors.textMuted },
  section: { padding: 16 },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 16 },
  compactCard: { width: 140, backgroundColor: theme.colors.white, padding: 16, borderRadius: 16, marginRight: 12, borderWidth: 1, borderColor: theme.colors.border },
  itemIcon: { fontSize: 32, marginBottom: 8 },
  itemTitle: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 4 },
  itemPrice: { ...theme.typography.caption, color: theme.colors.primary },
  emptyText: { ...theme.typography.bodyMd, color: theme.colors.textMuted, fontStyle: 'italic' },
  reviewCard: { backgroundColor: theme.colors.white, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewerName: { ...theme.typography.labelBold, color: theme.colors.text },
  stars: { fontSize: 12 },
  reviewComment: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  footer: { padding: 16, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, flexDirection: 'row', gap: 12 },
  messageBtn: { flex: 1 },
  btnGrad: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  messageBtnText: { ...theme.typography.labelBold, color: theme.colors.white },
  outlineBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { ...theme.typography.labelBold, color: theme.colors.text },
});
