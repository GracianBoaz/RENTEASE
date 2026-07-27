import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';

type ReviewSuccessRouteProp = RouteProp<SharedStackParamList, 'ReviewSuccess'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'ReviewSuccess'>;

export default function ReviewSuccessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReviewSuccessRouteProp>();
  const { itemName = 'Item', itemId } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.checkIcon}>✅</Text>
        </View>

        <Text style={styles.title}>Review Submitted!</Text>
        <Text style={styles.subtitle}>
          Thank you for sharing your experience. Your review helps other renters make better decisions.
        </Text>

        <View style={styles.starsRow}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.star}>⭐</Text>
        </View>

        <Text style={styles.itemName}>📦 {itemName}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('ItemDetail', { item: { id: itemId } })}>
          <Text style={styles.outlineBtnText}>View Item</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('RentalsMain')}>
          <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Back to My Rentals</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  checkIcon: { fontSize: 48 },
  title: { fontFamily: 'Epilogue-ExtraBold', fontSize: 26, color: '#1A1625', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontFamily: 'Manrope-Regular', fontSize: 14, color: '#6B6478', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  star: { fontSize: 24 },
  itemName: { ...theme.typography.caption, color: theme.colors.textMuted },
  footer: { padding: 24, gap: 16 },
  outlineBtn: { paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center' },
  outlineBtnText: { ...theme.typography.labelBold, color: theme.colors.text },
  primaryBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { ...theme.typography.labelBold, color: theme.colors.white },
});
