import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { askGemini } from '../utils/gemini';
import { theme } from '../constants/theme';
import { FeedbackCard } from './FeedbackCard';
import { AILoadingSpinner } from './AILoadingSpinner';

interface ReviewSummaryCardProps {
  itemId: string;
}

export function ReviewSummaryCard({ itemId }: ReviewSummaryCardProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzReviews = async () => {
      try {
        setLoading(true);

        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating, comment')
          .eq('item_id', itemId);

        if (!reviews || reviews.length === 0) {
          setLoading(false);
          return;
        }

        const reviewsText = reviews
          .map((r) => `Rating: ${r.rating}/5. "${r.comment}"`)
          .join('\n');

        const prompt = `
          Analyze these rental item reviews:
          
          ${reviewsText}
          
          Extract and categorize:
          1. Pros (positive points, count mentions)
          2. Cons (negative points, count mentions)
          3. Common themes
          4. Overall sentiment
          
          Return JSON:
          {
            "pros": [
              { "point": "Great condition", "mentions": 11 },
              { "point": "Works perfectly", "mentions": 10 }
            ],
            "cons": [
              { "point": "A bit heavy", "mentions": 3 }
            ],
            "commonFeedback": "Excellent condition, only minor scratches",
            "sentiment": "VERY_POSITIVE|POSITIVE|NEUTRAL|NEGATIVE",
            "confidence": 0.92
          }
        `;

        const response = await askGemini(prompt);
        if (response) {
          const parsed = JSON.parse(response);
          setSummary(parsed);
        }
      } catch (error) {
        console.error('Review analysis error:', error);
      } finally {
        setLoading(false);
      }
    };

    analyzReviews();
  }, [itemId]);

  if (loading) {
    return <AILoadingSpinner message="Analyzing reviews..." />;
  }

  if (!summary) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 What Renters Say</Text>

      <Text style={styles.sectionTitle}>✅ PROS:</Text>
      {summary.pros?.map((pro: any, idx: number) => (
        <View key={idx} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>
            {pro.point} ({pro.mentions} votes)
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>⚠️ CONS:</Text>
      {summary.cons?.length > 0 ? (
        summary.cons.map((con: any, idx: number) => (
          <View key={idx} style={styles.listItem}>
            <Text style={[styles.bullet, { color: theme.colors.error }]}>
              •
            </Text>
            <Text style={styles.listText}>
              {con.point} ({con.mentions} votes)
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.noCons}>No major issues reported</Text>
      )}

      <FeedbackCard
        icon="💬"
        title="Common Feedback"
        content={summary.commonFeedback}
        type="info"
        confidence={summary.confidence}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Epilogue',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Manrope',
    color: theme.colors.text,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  bullet: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
    color: theme.colors.success,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'Manrope',
  },
  noCons: {
    fontSize: 14,
    color: theme.colors.success,
    fontStyle: 'italic',
    marginHorizontal: theme.spacing.md,
  },
});
