import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Image, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';

type Step2RouteProp = RouteProp<SharedStackParamList, 'AddItemStep2'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'AddItemStep2'>;

export default function AddItemStep2Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Step2RouteProp>();
  const { itemData } = route.params;

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [pricePerDay, setPricePerDay] = useState('');
  const [minDays, setMinDays] = useState(1);
  const [maxDays, setMaxDays] = useState(30);
  const [deposit, setDeposit] = useState('');



  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setSelectedImages(prev => [...prev, ...uris].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (!pricePerDay || selectedImages.length === 0) {
      Alert.alert('Missing Fields', 'Please upload at least 1 photo and set a daily price.');
      return;
    }

    const updatedItemData = {
      ...itemData,
      images: selectedImages,
      localImageUris: selectedImages,
      pricePerDay: parseFloat(pricePerDay),
      price_per_day: Number(pricePerDay),
      minDays,
      maxDays,
      min_rental_days: minDays,
      max_rental_days: maxDays,
      securityDeposit: deposit ? parseFloat(deposit) : 0,
      deposit_amount: Number(deposit),
      condition: itemData?.condition || 'Good',
    };

    navigation.navigate('AddItemStep3', { itemData: updatedItemData });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step 2 of 3</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '66%' }]} />
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Photos & Pricing</Text>
          <Text style={styles.headerSubtitle}>Showcase your item and set its value</Text>
        </View>

        {/* Photos Section */}
        <Text style={styles.label}>Photos <Text style={styles.required}>*</Text></Text>
        <Text style={styles.hintText}>Add up to 5 photos. First photo will be the cover.</Text>
        
        <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
          <Ionicons name="camera-outline" size={40} color={theme.colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.uploadText}>Tap to Add Photos</Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoContainer}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removeImage(index)}>
                  <Ionicons name="close" size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.divider} />

        <Text style={styles.label}>Price per day <Text style={styles.required}>*</Text></Text>
        <View style={[styles.priceInputWrapper, { marginBottom: theme.spacing.xl }]}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput 
            style={styles.priceInput}
            placeholder="0"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            value={pricePerDay}
            onChangeText={setPricePerDay}
          />
        </View>

        <View style={styles.stepperContainer}>
          <Text style={styles.label}>Minimum Rental Days</Text>
          <View style={styles.stepperControls}>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => setMinDays(Math.max(1, minDays - 1))}
            >
              <Ionicons name="remove" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{minDays}</Text>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => setMinDays(minDays + 1)}
            >
              <Ionicons name="add" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stepperContainer}>
          <Text style={styles.label}>Maximum Rental Days</Text>
          <View style={styles.stepperControls}>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => setMaxDays(Math.max(minDays, maxDays - 1))}
            >
              <Ionicons name="remove" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{maxDays}</Text>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => setMaxDays(maxDays + 1)}
            >
              <Ionicons name="add" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Security Deposit (Optional)</Text>
        <Text style={styles.hintText}>Amount to hold during the rental period</Text>
        <View style={[styles.inputContainer, styles.priceInputWrapper]}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput 
            style={styles.priceInput}
            placeholder="0"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            value={deposit}
            onChangeText={setDeposit}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

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
  
  label: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 8 },
  required: { color: theme.colors.error },
  hintText: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: 16 },
  
  uploadBox: { height: 160, borderWidth: 2, borderColor: theme.colors.primary, borderStyle: 'dashed', borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.primary + '05', justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.md },
  uploadText: { ...theme.typography.labelBold, color: theme.colors.primary },
  
  photoContainer: { flexDirection: 'row', marginBottom: theme.spacing.md },
  photoWrapper: { width: 100, height: 100, borderRadius: theme.borderRadius.md, marginRight: theme.spacing.md, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%' },
  removePhotoBtn: { position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.xl },
  
  inputContainer: { marginBottom: theme.spacing.xl },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.white, height: 56, paddingHorizontal: theme.spacing.md },
  currencySymbol: { ...theme.typography.h3, color: theme.colors.textMuted, marginRight: 8 },
  priceInput: { flex: 1, ...theme.typography.bodyMd, color: theme.colors.text, fontSize: 18 },
  
  stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xl },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  stepperValue: { ...theme.typography.h3, color: theme.colors.text, minWidth: 24, textAlign: 'center' },
  
  footer: { padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.lg },
  nextBtn: { height: 56, borderRadius: theme.borderRadius.pill, justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 18 },
});
