import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';

type FAQRouteProp = RouteProp<SharedStackParamList, 'FAQDetail'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'FAQDetail'>;

const RELATED_QA = [
  { q: 'How do I cancel a booking?', a: 'Go to Rentals tab, tap the booking, and select "Cancel Booking". Free cancellation if done 24 hours before rental start.' },
  { q: 'How is payment handled?', a: 'Payment details are exchanged directly between renter and owner upon booking confirmation. RentEase currently facilitates the connection at zero commission.' },
  { q: 'What if the item is damaged?', a: 'Contact the owner immediately through in-app chat. Document the damage with photos. If unresolved, use the Report Problem button below.' }
];

export default function FAQDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FAQRouteProp>();
  const { question = 'General Question', answer = 'Detailed answer will be provided here.' } = route.params || {};

  const handleFeedback = (type: 'yes' | 'no') => {
    // Show toast equivalent
    Alert.alert('Feedback', 'Thank you for your feedback!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>FAQ</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.questionTitle}>{question}</Text>
        <Text style={styles.answerText}>{answer}</Text>

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Was this helpful?</Text>
          <View style={styles.feedbackRow}>
            <TouchableOpacity style={[styles.feedbackBtn, { borderColor: theme.colors.success }]} onPress={() => handleFeedback('yes')}>
              <Text style={[styles.feedbackBtnText, { color: theme.colors.success }]}>👍 Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.feedbackBtn, { borderColor: theme.colors.error }]} onPress={() => handleFeedback('no')}>
              <Text style={[styles.feedbackBtnText, { color: theme.colors.error }]}>👎 No</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.relatedTitle}>Related Questions</Text>
        <View style={styles.relatedList}>
          {RELATED_QA.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.relatedItem}
              onPress={() => navigation.push('FAQDetail', { question: item.q, answer: item.a })}
            >
              <Text style={styles.relatedItemText} numberOfLines={2}>{item.q}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Still need help?</Text>
          <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('mailto:support@rentease.app')}>
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { ...theme.typography.labelBold, color: theme.colors.text },
  title: { ...theme.typography.h3, color: theme.colors.text },
  content: { padding: theme.spacing.lg },
  questionTitle: { fontFamily: 'Epilogue-ExtraBold', fontSize: 20, color: '#1A1625', marginBottom: 16 },
  answerText: { fontFamily: 'Manrope-Regular', fontSize: 15, color: '#6B6478', lineHeight: 24, marginBottom: 32 },
  feedbackSection: { marginBottom: 40 },
  feedbackTitle: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 12 },
  feedbackRow: { flexDirection: 'row', gap: 16 },
  feedbackBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center', backgroundColor: theme.colors.white },
  feedbackBtnText: { ...theme.typography.labelBold },
  relatedTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 16 },
  relatedList: { backgroundColor: theme.colors.white, borderRadius: 16, overflow: 'hidden', marginBottom: 32 },
  relatedItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  relatedItemText: { ...theme.typography.bodyMd, color: theme.colors.text, flex: 1, paddingRight: 16 },
  arrow: { fontSize: 24, color: theme.colors.textMuted },
  supportCard: { backgroundColor: theme.colors.white, borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  supportTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 16 },
  supportBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.colors.primary + '10' },
  supportBtnText: { ...theme.typography.labelBold, color: theme.colors.primary },
});
