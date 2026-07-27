import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type ReviewRouteProp = RouteProp<SharedStackParamList, 'WriteReview'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'WriteReview'>;

const RATING_TEXT = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function WriteReviewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReviewRouteProp>();
  const { booking } = route.params;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 3 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 3 - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...newImages].slice(0, 3));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');
      
      const uid = session.user.id;

      // In full implementation, upload images to storage here
      // For now, insert review
      const { error: insertError } = await supabase.from('reviews').insert({
        item_id: booking.item_id,
        reviewer_id: uid,
        booking_id: booking.id,
        rating,
        comment,
      });

      if (insertError) throw insertError;

      // Update item rating average
      const { data: reviews } = await supabase.from('reviews').select('rating').eq('item_id', booking.item_id);
      if (reviews) {
        const totalCount = reviews.length;
        const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
        const avgRating = sum / totalCount;

        await supabase.from('items').update({
          rating: avgRating,
          review_count: totalCount,
        }).eq('id', booking.item_id);
      }

      Alert.alert('Success', 'Thank you for your review!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Write a Review</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📦 {booking.items?.title}</Text>
          <Text style={styles.summaryText}>{booking.start_date} to {booking.end_date}</Text>
          <Text style={styles.summaryText}>Owner: {booking.owner?.full_name}</Text>
        </View>

        <Text style={styles.sectionTitle}>Rate your experience</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={star <= rating ? styles.starFilled : styles.starEmpty}>
                {star <= rating ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating > 0 ? (RATING_TEXT as any)[rating] : 'Select a rating'}
        </Text>

        <Text style={styles.sectionTitle}>Review Text</Text>
        <View style={styles.inputContainer}>
          <TextInput style={{
            backgroundColor: '#F0EEF4',
            borderRadius: 12,
            padding: 12,
            fontSize: 15,
            color: '#1A1625',
            borderWidth: 1.5,
            borderColor: 'rgba(108,63,232,0.12)',
          }}
          placeholderTextColor="#A09AB0"
           
            
            placeholder="Share details about the item condition, owner responsiveness, and overall experience..."
            multiline
            numberOfLines={5}
            maxLength={500}
            value={comment}
            onChangeText={setComment}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        <Text style={styles.sectionTitle}>Add Photos (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoContainer}>
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
            <Text style={styles.addPhotoIcon}>📸</Text>
          </TouchableOpacity>
          {images.map((uri, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photoThumb} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removeImage(index)}>
                <Text style={styles.removePhotoText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSubmit} disabled={rating === 0 || loading}>
          <LinearGradient
            colors={rating > 0 ? [theme.colors.primary, theme.colors.secondary] : [theme.colors.border, theme.colors.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitBtn}
          >
            {loading ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.submitBtnText}>Submit Review</Text>}
          </LinearGradient>
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
  content: { padding: theme.spacing.lg },
  summaryCard: { backgroundColor: theme.colors.white, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border },
  summaryTitle: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 4 },
  summaryText: { ...theme.typography.bodySm, color: theme.colors.textMuted },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm },
  starEmpty: { fontSize: 48, color: theme.colors.border },
  starFilled: { fontSize: 48 },
  ratingText: { textAlign: 'center', ...theme.typography.labelBold, color: theme.colors.primary, marginBottom: theme.spacing.xl },
  inputContainer: { marginBottom: theme.spacing.xl },
  textArea: { height: 120, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, backgroundColor: theme.colors.white, textAlignVertical: 'top', ...theme.typography.bodyMd },
  charCount: { ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'right', marginTop: 4 },
  photoContainer: { flexDirection: 'row', marginBottom: theme.spacing.xl },
  addPhotoBtn: { width: 80, height: 80, borderRadius: theme.borderRadius.md, borderWidth: 2, borderColor: theme.colors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md, backgroundColor: theme.colors.primary + '10' },
  addPhotoIcon: { fontSize: 24 },
  photoWrapper: { width: 80, height: 80, borderRadius: theme.borderRadius.md, marginRight: theme.spacing.md, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%' },
  removePhotoBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  removePhotoText: { color: theme.colors.white, fontSize: 10, fontWeight: 'bold' },
  footer: { padding: theme.spacing.xl, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border },
  submitBtn: { height: 52, borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 16 },
});
