import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking, Image, StatusBar, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';
import { checkFraud } from '../../utils/aiService';
import * as FileSystem from 'expo-file-system';
import { runSmartMatching } from '../../services/SmartMatchingService';

type PreviewRouteProp = RouteProp<SharedStackParamList, 'ItemPreview'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'ItemPreview'>;

export default function ItemPreviewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PreviewRouteProp>();
  const { itemData } = route.params;

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  const [fraudResult, setFraudResult] = useState<any>(null);
  const [checkingFraud, setCheckingFraud] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setUserId(data.session.user.id);
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.session.user.id).single();
        if (profile) setUserName(profile.full_name);
      }
    });
    runFraudCheck();
  }, []);

  const runFraudCheck = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: listings } = await supabase.from('items').select('id').eq('owner_id', user?.id);
      const { data: profile } = await supabase.from('profiles').select('created_at').eq('id', user?.id).single();
      const accountAgeDays = profile?.created_at
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const result = await checkFraud({
        title: itemData.title,
        description: itemData.description,
        price_per_day: itemData.pricePerDay,
        category: `Category ${itemData.categoryId}`,
        ownerAccountAgeDays: accountAgeDays,
        ownerTotalListings: listings?.length || 0,
      });
      setFraudResult(result);
    } catch (err) {
      console.log('Fraud check error:', err);
    } finally {
      setCheckingFraud(false);
    }
  };

  const uploadImagesToSupabase = async (uris: string[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    // Get current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No session found');
      return [];
    }

    const supabaseUrl = 'https://slzmledfrkuffsgmyqxx.supabase.co';
    const authToken = session.access_token;

    for (const uri of uris) {
      try {
        console.log('Uploading URI:', uri);

        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpeg`;
        const filePath = `public/${fileName}`;

        // Use fetch with FormData — most reliable in React Native
        const formData = new FormData();
        formData.append('file', {
          uri: uri,
          name: fileName,
          type: 'image/jpeg',
        } as any);

        const uploadUrl = `${supabaseUrl}/storage/v1/object/item-images/${filePath}`;
        console.log('Upload URL:', uploadUrl);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsem1sZWRmcmt1ZmZzZ215cXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjQ0NzMsImV4cCI6MjA5MzEwMDQ3M30.rIWvQ2XsCECHqNz3iaMiwEdnoLIT7FP3I7jyaHw3H1Q',
            'x-upsert': 'true',
          },
          body: formData,
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (response.ok) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/item-images/${filePath}`;
          console.log('Success! Public URL:', publicUrl);
          uploadedUrls.push(publicUrl);
        } else {
          console.log('Upload failed with status:', response.status);
        }
      } catch (err: any) {
        console.log('Upload exception:', err?.message);
      }
    }

    console.log('Uploaded URLs:', uploadedUrls);
    return uploadedUrls;
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // Upload images first
      console.log('Local image URIs:', itemData.localImageUris);
      let imageUrls: string[] = [];
      if (itemData.localImageUris && itemData.localImageUris.length > 0) {
        imageUrls = await uploadImagesToSupabase(itemData.localImageUris);
        console.log('Uploaded URLs:', imageUrls);
      }

      if (imageUrls.length === 0) {
        Alert.alert(
          'Upload Failed',
          `Failed to upload ${itemData.localImageUris?.length || 0} image(s). Please check internet connection and try again.`,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Validate category_id against categories table to prevent items_category_id_fkey violation
      let validCategoryId: number | null = null;
      if (itemData.categoryId) {
        const { data: catCheck } = await supabase
          .from('categories')
          .select('id')
          .eq('id', itemData.categoryId)
          .maybeSingle();
        if (catCheck) {
          validCategoryId = itemData.categoryId;
        }
      }

      // Save to database with uploaded URLs
      const { data: newItem, error } = await supabase
        .from('items')
        .insert({
          owner_id: user.id,
          title: itemData.title,
          description: itemData.description,
          category_id: validCategoryId,
          condition: itemData.condition,
          price_per_day: itemData.pricePerDay || itemData.price_per_day,
          price_per_hour: itemData.pricePerHour,
          brand: itemData.brand,
          model: itemData.model,
          images: imageUrls,
          location_lat: itemData.location_lat,
          location_lng: itemData.location_lng,
          location_address: itemData.location_address,
          location_pincode: itemData.location_pincode,
          location_city: itemData.location_city,
          location_state: itemData.location_state,
          location_name: itemData.locationName,
          is_available: true,
          specs: itemData.specs,
          fraud_score: fraudResult?.score || 0,
          fraud_risk: fraudResult?.riskLevel || 'low',
        })
        .select('id')
        .single();

      if (error) throw error;

      if (newItem?.id) {
        runSmartMatching(newItem.id).catch(console.error);
      }

      Alert.alert('🎉 Listed!', 'Your item is now live!', [
        { text: 'OK', onPress: () => navigation.navigate('Home' as any) }
      ]);
    } catch (err: any) {
      console.log('Publish error:', err);
      Alert.alert('Error', err.message || 'Failed to publish.');
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = itemData.images && itemData.images.length > 0 ? itemData.images[0] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Preview Mode Banner */}
      <View style={styles.previewBanner}>
        <Ionicons name="eye" size={16} color="#B45309" />
        <Text style={styles.previewBannerText}>Preview Mode - This is how renters will see your listing</Text>
      </View>

      {/* Fraud Banner in Preview Screen */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, backgroundColor: theme.colors.white }}>
        {checkingFraud ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#F8FAFC', borderRadius: theme.borderRadius.md }}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={{ ...theme.typography.bodySm, color: theme.colors.textMuted }}>🛡️ Running AI safety check...</Text>
          </View>
        ) : fraudResult && (
          <View style={{
            padding: 12,
            borderRadius: theme.borderRadius.md,
            backgroundColor: fraudResult.riskLevel === 'low' ? '#D1FAE5' : fraudResult.riskLevel === 'medium' ? '#FEF9C3' : '#FEE2E2',
            borderWidth: 1,
            borderColor: fraudResult.riskLevel === 'low' ? '#10B981' : fraudResult.riskLevel === 'medium' ? '#F59E0B' : '#EF4444',
            marginBottom: 4,
          }}>
            <Text style={{ fontWeight: '700', color: fraudResult.riskLevel === 'low' ? '#059669' : fraudResult.riskLevel === 'medium' ? '#CA8A04' : '#DC2626' }}>
              {fraudResult.riskLevel === 'low' ? '✅ LOW RISK — Listing looks legitimate' : fraudResult.riskLevel === 'medium' ? '⚠️ MEDIUM RISK — Review carefully' : '🚨 HIGH RISK — Suspicious listing detected'}
            </Text>
            <Text style={{ ...theme.typography.bodySm, color: theme.colors.textMuted, marginTop: 4 }}>
              Safety score: {100 - fraudResult.score}/100
            </Text>
            {fraudResult.reasons.length > 0 && fraudResult.reasons.map((r: string, i: number) => (
              <Text key={i} style={{ ...theme.typography.bodySm, color: theme.colors.text, marginTop: 2 }}>• {r}</Text>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Edge-to-edge Hero Image */}
        <View style={styles.heroImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={64} color={theme.colors.textMuted} />
            </View>
          )}
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={styles.heroTopGradient} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerInfo}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{itemData.title}</Text>
              <Text style={styles.priceText}>₹{itemData.pricePerDay}<Text style={styles.priceUnit}> / day</Text></Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={16} color={theme.colors.primary} />
              <Text style={styles.metaText}>{itemData.locationName || 'Location unknown'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.metaText}>New (0 reviews)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerInitials}>{userName.charAt(0) || 'Y'}</Text>
            </View>
            <View style={styles.ownerDetails}>
              <Text style={styles.ownerName}>{userName || 'You'}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Verified Owner</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this item</Text>
          <Text style={styles.descriptionText}>{itemData.description}</Text>

          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specsGrid}>
            <View style={styles.specBox}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.textMuted} />
              <Text style={styles.specLabel}>Condition</Text>
              <Text style={styles.specValue}>{itemData.condition || 'Good'}</Text>
            </View>
            <View style={styles.specBox}>
              <Ionicons name="grid-outline" size={20} color={theme.colors.textMuted} />
              <Text style={styles.specLabel}>Category</Text>
              <Text style={styles.specValue}>Category {itemData.categoryId}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.floatingBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.editBtnContainer}
          onPress={() => navigation.navigate('AddItemStep1', { itemData })}
        >
          <View style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Listing</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bookBtnContainer}
          onPress={handlePublish}
          disabled={loading}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bookBtn}
          >
            {loading ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.bookBtnText}>Publish Now</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  previewBanner: { backgroundColor: '#FEF3C7', paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 30, zIndex: 20 },
  previewBannerText: { ...theme.typography.caption, color: '#B45309', fontWeight: 'bold', marginLeft: 8 },
  scrollContent: { flex: 1 },
  heroImageContainer: { width: '100%', height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  placeholderImage: { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  heroTopGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  floatingHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 90 : 80, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
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
  sectionTitle: { ...theme.typography.h3, fontSize: 18, color: theme.colors.text, marginBottom: theme.spacing.md },
  descriptionText: { ...theme.typography.bodyMd, color: theme.colors.textMuted, lineHeight: 24, marginBottom: theme.spacing.xl },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.xl },
  specBox: { width: '48%', backgroundColor: theme.colors.background, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
  specLabel: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: 8, marginBottom: 4 },
  specValue: { ...theme.typography.labelBold, color: theme.colors.text },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border, ...theme.shadows.lg, gap: 12 },
  editBtnContainer: { flex: 1 },
  editBtn: { height: 52, borderRadius: theme.borderRadius.pill, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  editBtnText: { ...theme.typography.labelBold, color: theme.colors.text, fontSize: 16 },
  bookBtnContainer: { flex: 1.5 },
  bookBtn: { height: 52, borderRadius: theme.borderRadius.pill, justifyContent: 'center', alignItems: 'center' },
  bookBtnText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 16 },
});
