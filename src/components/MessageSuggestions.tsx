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
import { SmartChip } from './SmartChip';
import { AILoadingSpinner } from './AILoadingSpinner';

interface MessageSuggestionsProps {
  itemId: string;
  receiverRole: 'owner' | 'renter';
  onSelect: (message: string) => void;
}

export function MessageSuggestions({
  itemId,
  receiverRole,
  onSelect,
}: MessageSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSuggestions = async () => {
      try {
        setLoading(true);

        const { data: item } = await supabase
          .from('items')
          .select('title, category, price_per_day')
          .eq('id', itemId)
          .single();

        if (!item) return;

        const prompt = `
          Context:
          - User is ${receiverRole === 'owner' ? 'renter' : 'owner'}
          - Item: ${item.title}
          - Category: ${item.category}
          - Price: ₹${item.price_per_day}/day
          
          Generate 4 natural, helpful message suggestions that:
          1. Are relevant to this item
          2. Sound natural (not robotic)
          3. Ask important questions
          4. Are one sentence max
          
          Return JSON:
          {
            "suggestions": [
              "Is this still available?",
              "What's the pickup location?",
              "..."
            ]
          }
        `;

        const response = await askGemini(prompt);
        if (response) {
          const parsed = JSON.parse(response);
          setSuggestions(parsed.suggestions);
        }
      } catch (error) {
        console.error('Error loading suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    getSuggestions();
  }, [itemId, receiverRole]);

  if (loading) {
    return null;
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💡 Suggested Messages:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {suggestions.map((suggestion, idx) => (
          <SmartChip
            key={idx}
            label={suggestion}
            onPress={() => onSelect(suggestion)}
            style={{ marginRight: theme.spacing.md }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  scrollView: {
    flexGrow: 0,
  },
});
