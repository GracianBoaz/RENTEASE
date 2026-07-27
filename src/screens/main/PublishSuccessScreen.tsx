import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Share } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';

type SuccessRouteProp = RouteProp<SharedStackParamList, 'PublishSuccess'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'PublishSuccess'>;

export default function PublishSuccessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SuccessRouteProp>();
  const { itemData } = route.params;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Rent my ${itemData.title} on RentEase for just ₹${itemData.price_per_day}/day!`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.celebrationHeader}>
          <Text style={styles.confetti}>🎊 🎉 🎊</Text>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>✅</Text>
          </View>
          <Text style={styles.title}>Your Item is Live! 🎉</Text>
          <Text style={styles.subtitle}>Renters near you can now discover and book your item</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Listing Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>📦</Text>
            <View>
              <Text style={styles.itemTitle}>{itemData.title}</Text>
              <Text style={styles.itemDetails}>₹{itemData.price_per_day}/day</Text>
            </View>
          </View>
        </View>

        <View style={styles.shareSection}>
          <Text style={styles.shareTitle}>Share your listing</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>📤 Share Link</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => navigation.navigate('AddItemStep1', {})}
          >
            <Text style={styles.secondaryButtonText}>Add Another Item</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            onPress={() => navigation.navigate('ItemDetail', { item: itemData })}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>View My Listing</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('RentalsMain')}>
          <Text style={styles.linkText}>Go to My Listings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  confetti: {
    fontSize: 32,
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  cardTitle: {
    ...theme.typography.labelBold,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  itemTitle: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
  },
  itemDetails: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  shareSection: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  shareTitle: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  shareBtn: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.primary + '10',
  },
  shareBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.primary,
  },
  footer: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...theme.typography.labelBold,
    color: theme.colors.primary,
  },
  primaryButton: {
    height: 52,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  linkText: {
    ...theme.typography.labelBold,
    color: theme.colors.textMuted,
  },
});
