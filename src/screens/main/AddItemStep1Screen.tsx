import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'AddItemStep1'>;

const CATEGORIES = [
  { id: 1, name: 'Electric Vehicles', icon: 'car-sport-outline' },
  { id: 2, name: 'Electronics', icon: 'laptop-outline' },
  { id: 3, name: 'Tools', icon: 'construct-outline' },
  { id: 4, name: 'Other', icon: 'cube-outline' },
];

const CONDITIONS = [
  { id: 'new', label: 'New' },
  { id: 'like_new', label: 'Like New' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
];

export default function AddItemStep1Screen() {
  const navigation = useNavigation<NavigationProp>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [condition, setCondition] = useState<string | null>(null);

  const handleNext = () => {
    if (!title || !category || !condition) {
      Alert.alert('Missing Fields', 'Title, Category, and Condition are required.');
      return;
    }
    const itemData = {
      title,
      description,
      categoryId: category,
      condition,
      images: [] // To be handled in Step 2
    };
    navigation.navigate('AddItemStep2', { itemData });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step 1 of 3</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '33%' }]} />
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>List Your Item</Text>
          <Text style={styles.headerSubtitle}>Let's start with the basic details</Text>
        </View>

        {/* Item Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Item Title <Text style={styles.required}>*</Text></Text>
          <TextInput 
            style={styles.input}
            placeholder="e.g. Sony A7III Camera with Lens"
            placeholderTextColor={theme.colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
        </View>

        {/* Category Selector */}
        <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.categoryCard,
                category === c.id && styles.categoryCardActive
              ]}
              onPress={() => setCategory(c.id)}
            >
              <Ionicons 
                name={c.icon as any} 
                size={24} 
                color={category === c.id ? theme.colors.primary : theme.colors.textMuted} 
              />
              <Text style={[
                styles.categoryText,
                category === c.id && styles.categoryTextActive
              ]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Condition Selector */}
        <Text style={styles.label}>Condition <Text style={styles.required}>*</Text></Text>
        <View style={styles.chipsContainer}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.chip,
                condition === c.id && styles.chipActive
              ]}
              onPress={() => setCondition(c.id)}
            >
              <Text style={[
                styles.chipText,
                condition === c.id && styles.chipTextActive
              ]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={styles.textArea}
            placeholder="Describe your item, features, and any other important details..."
            placeholderTextColor={theme.colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleNext}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>Next Step →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  progressContainer: { flex: 1, alignItems: 'center', marginHorizontal: theme.spacing.lg },
  progressText: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 8, fontSize: 14 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: theme.colors.border, borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: theme.colors.primary, borderRadius: 3 },
  
  content: { flex: 1, padding: theme.spacing.lg },
  headerTextContainer: { marginBottom: theme.spacing.xl },
  headerTitle: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 4 },
  headerSubtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  
  inputContainer: { marginBottom: theme.spacing.xl },
  label: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  required: { color: theme.colors.error },
  input: { height: 56, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, backgroundColor: theme.colors.white, ...theme.typography.bodyMd, color: theme.colors.text },
  
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.xl },
  categoryCard: { width: '48%', backgroundColor: theme.colors.background, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', height: 100 },
  categoryCardActive: { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary },
  categoryText: { ...theme.typography.labelBold, color: theme.colors.textMuted, marginTop: 8 },
  categoryTextActive: { color: theme.colors.primary },
  
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.xl },
  chip: { paddingHorizontal: theme.spacing.lg, paddingVertical: 12, borderRadius: theme.borderRadius.pill, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' },
  chipText: { ...theme.typography.labelBold, color: theme.colors.text },
  chipTextActive: { color: theme.colors.primary },
  
  textArea: { height: 120, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, backgroundColor: theme.colors.white, ...theme.typography.bodyMd, color: theme.colors.text },
  charCount: { ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'right', marginTop: 8 },
  
  footer: { padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.lg },
  nextBtn: { height: 56, borderRadius: theme.borderRadius.pill, justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 18 },
});
