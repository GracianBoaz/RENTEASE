import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, LayoutAnimation, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'HelpSupport'>;

const TOPICS = ['Booking', 'Payment', 'Account', 'Listing', 'Safety', 'Returns'];

const FAQS = [
  { q: 'How do I rent an item?', a: 'Browse items on the Home or Search screen. Tap an item to view details, select your rental dates, and tap "Book Now" to send a request. The owner will confirm within 24 hours.' },
  { q: 'How do I list my item for rent?', a: 'Go to the Rentals tab, switch to "My Listings", tap "+ List New Item" and follow the 3-step process to add photos, set pricing, and choose your location.' },
  { q: 'How is payment handled?', a: 'Payment details are exchanged directly between renter and owner upon booking confirmation. RentEase currently facilitates the connection at zero commission.' },
  { q: 'What if the item is damaged?', a: 'Contact the owner immediately through in-app chat. Document the damage with photos. If unresolved, use the Report Problem button below.' },
  { q: 'How do I cancel a booking?', a: 'Go to Rentals tab, tap the booking, and select "Cancel Booking". Free cancellation if done 24 hours before rental start.' },
  { q: 'Are reviews verified?', a: 'Yes. Only users who have completed a rental transaction can leave a review for that item.' },
  { q: 'How does GPS location work?', a: 'RentEase uses your phone GPS to show items near you. You can update your location anytime from the Profile screen.' },
];

export default function HelpSupportScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleReport = () => {
    Alert.prompt(
      'Report a Problem',
      'Describe your problem...',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => Alert.alert('Thank you', 'Your report has been submitted.') }
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.searchContainer}>
          <TextInput style={{
            backgroundColor: '#F0EEF4',
            borderRadius: 12,
            padding: 12,
            fontSize: 15,
            color: '#1A1625',
            borderWidth: 1.5,
            borderColor: 'rgba(108,63,232,0.12)',
          }}
          placeholderTextColor="#A09AB0"   placeholder="Search help articles..." />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll}>
          {TOPICS.map((topic) => (
            <TouchableOpacity key={topic} style={styles.topicChip}>
              <Text style={styles.topicText}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <TouchableOpacity key={index} style={styles.faqItem} onPress={() => toggleAccordion(index)}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
                {isExpanded && (
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Still need help?</Text>
        <View style={styles.contactCard}>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@rentease.app')}>
            <Text style={styles.contactIcon}>📧</Text>
            <Text style={styles.contactLabel}>Email Support</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={handleReport}>
            <Text style={styles.contactIcon}>📋</Text>
            <Text style={styles.contactLabel}>Report a Problem</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { fontSize: 24, color: theme.colors.text },
  title: { ...theme.typography.h3, color: theme.colors.text },
  content: { padding: theme.spacing.lg },
  searchContainer: { backgroundColor: '#F0EEF4', borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 },
  searchInput: { height: 48, ...theme.typography.bodyMd },
  topicsScroll: { marginBottom: 32, flexDirection: 'row' },
  topicChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.white, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, marginRight: 8 },
  topicText: { ...theme.typography.caption, color: theme.colors.text },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 16 },
  faqList: { backgroundColor: theme.colors.white, borderRadius: 16, overflow: 'hidden', marginBottom: 32 },
  faqItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { ...theme.typography.labelBold, color: theme.colors.text, flex: 1, paddingRight: 16 },
  chevron: { color: theme.colors.textMuted, fontSize: 12 },
  faqAnswer: { ...theme.typography.bodyMd, color: theme.colors.textMuted, marginTop: 12, lineHeight: 22 },
  contactCard: { backgroundColor: theme.colors.white, borderRadius: 16, paddingVertical: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  contactIcon: { fontSize: 20, marginRight: 16 },
  contactLabel: { ...theme.typography.labelBold, color: theme.colors.primary },
  divider: { height: 1, backgroundColor: theme.colors.border, marginHorizontal: 16 },
});
