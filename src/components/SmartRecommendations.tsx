import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { supabase } from '../utils/supabase';
import { askGemini } from '../utils/gemini';
import { theme } from '../constants/theme';
import { AILoadingSpinner } from './AILoadingSpinner';

export function SmartRecommendations({ onItemPress }: any) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch user's booking history
        const { data: bookings } = await supabase
          .from('bookings')
          .select('item_id, items(*)')
          .eq('renter_id', user.id)
          .limit(5);

        // Fetch user's saved items
        const { data: saved } = await supabase
          .from('saved_items')
          .select('item_id, items(*)')
          .eq('user_id', user.id)
          .limit(5);

        // Fetch all available items
        const { data: allItems } = await supabase
          .from('items')
          .select('*')
          .eq('is_available', true)
          .limit(50);

        // Get user location
        const { data: profile } = await supabase
          .from('profiles')
          .select('location_lat, location_lng')
          .eq('id', user.id)
          .single();

        // Ask Gemini for recommendations
        const prompt = `
          User booking history: ${JSON.stringify(bookings?.slice(0, 3))}
          User saved items: ${JSON.stringify(saved?.slice(0, 3))}
          User location: ${profile?.location_lat}, ${profile?.location_lng}
          All available items: ${JSON.stringify(allItems?.slice(0, 30))}

          Recommend 5-6 rental items that this user would be interested in.
          Consider: similar to past bookings, saved items, and location proximity.

          Return JSON with exactly this format:
          {
            "recommendations": [
              {
                "itemId": "uuid",
                "reason": "string explaining why"
              }
            ]
          }
        `;

        const response = await askGemini(prompt);
        if (response) {
          const parsed = JSON.parse(response);
          const items = parsed.recommendations
            .map((rec: any) => {
              const item = allItems?.find((i: any) => i.id === rec.itemId);
              return item ? { ...item, reason: rec.reason } : null;
            })
            .filter((i: any) => i !== null);

          setRecommendations(items);
        }
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [user]);

  if (loading) {
    return <AILoadingSpinner message="Finding items for you..." />;
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Recommended For You</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
      >
        {recommendations.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => onItemPress(item)}
          >
            {item.images?.[0] && (
              <Image
                source={{ uri: item.images[0] }}
                style={styles.image}
              />
            )}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>₹{item.price_per_day}/day</Text>
            <View style={styles.ratingRow}>
              <Text>⭐ {item.rating?.toFixed(1) || '4.5'}</Text>
              <Text style={styles.distance}>📍 {item.distance || 0}km</Text>
            </View>
            <Text style={styles.reason}>{item.reason}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Epilogue',
    color: theme.colors.text,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  scroll: {
    paddingHorizontal: theme.spacing.md,
  },
  card: {
    width: 160,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
    ...theme.shadows.md,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    marginVertical: theme.spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  distance: {
    fontSize: 12,
  },
  reason: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
});
