import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';
import AddressForm from '../../components/AddressForm';
import { UserAddress } from '../../components/AddressManager';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'ProfileMain'>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ rentals: 0, listed: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  useEffect(() => {
    fetchProfileData();
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setAddresses(data);
  };

  const deleteAddress = async (id?: string) => {
    if (!id) return;
    try {
      await supabase.from('user_addresses').delete().eq('id', id);
      fetchAddresses();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProfileData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const uid = session.user.id;

    const [profileRes, rentalsRes, listingsRes, reviewsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('bookings').select('id', { count: 'exact' }).eq('renter_id', uid),
      supabase.from('items').select('id', { count: 'exact' }).eq('owner_id', uid),
      supabase.from('reviews').select('id', { count: 'exact' }).eq('reviewer_id', uid),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    
    setStats({
      rentals: rentalsRes.count || 0,
      listed: listingsRes.count || 0,
      reviews: reviewsRes.count || 0,
    });

    setLoading(false);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  if (loading || !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header Gradient */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTopActions}>
             <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings-outline" size={24} color={theme.colors.white} />
             </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.bodyContent}>
          {/* Avatar overlapping header */}
          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(profile.full_name)}</Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.userInfoContainer}>
            <Text style={styles.nameText}>{profile.full_name}</Text>
            <Text style={styles.emailText}>{profile.email || 'Email linked'}</Text>
            
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
              <Text style={styles.verifiedText}>Verified User</Text>
            </View>

            <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.listed}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.rentals}</Text>
              <Text style={styles.statLabel}>Rentals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.reviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          {/* My Listings (Mock up section for now) */}
          <View style={styles.sectionContainer}>
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>My Listings</Text>
               <TouchableOpacity>
                 <Text style={styles.seeAllText}>See All</Text>
               </TouchableOpacity>
             </View>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {stats.listed > 0 ? (
                  <View style={styles.mockListingCard}>
                    <View style={styles.mockListingImage} />
                    <Text style={styles.mockListingTitle}>Item 1</Text>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No listings yet.</Text>
                )}
             </ScrollView>
          </View>

          {/* My Addresses */}
          <View style={styles.sectionContainer}>
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>My Addresses</Text>
             </View>
             
             {showAddressForm || editingAddress ? (
               <AddressForm 
                 onSave={() => { setShowAddressForm(false); setEditingAddress(null); fetchAddresses(); }}
                 onAddressSelected={() => { setShowAddressForm(false); setEditingAddress(null); fetchAddresses(); }}
                 onCancel={() => { setShowAddressForm(false); setEditingAddress(null); }}
                 initialValues={editingAddress || undefined}
               />
             ) : (
               <>
                 {addresses.length > 0 ? (
                   addresses.map(addr => (
                     <View key={addr.id} style={[styles.addressCard, addr.is_default && { borderColor: theme.colors.primary }]}>
                       {addr.is_default && <Text style={styles.defaultBadge}>Default</Text>}
                       <Text style={styles.addressName}>{addr.name}</Text>
                       <Text style={styles.addressPreview}>{addr.flat_house_no}, {addr.area_street_village}</Text>
                       <View style={styles.addressActions}>
                         <TouchableOpacity onPress={() => setEditingAddress(addr)}>
                           <Text style={styles.editBtnText}>Edit</Text>
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => deleteAddress(addr.id)}>
                           <Text style={[styles.editBtnText, { color: theme.colors.error, marginLeft: 16 }]}>Delete</Text>
                         </TouchableOpacity>
                       </View>
                     </View>
                   ))
                 ) : (
                   <Text style={styles.emptyText}>No saved addresses.</Text>
                 )}
                 <TouchableOpacity style={styles.addAddressBtn} onPress={() => setShowAddressForm(true)}>
                   <Ionicons name="add" size={20} color={theme.colors.text} />
                   <Text style={styles.addAddressBtnText}>Add New Address</Text>
                 </TouchableOpacity>
               </>
             )}
          </View>

          {/* My Reviews */}
          <View style={styles.sectionContainer}>
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>My Reviews</Text>
             </View>
             {stats.reviews > 0 ? (
                <View style={styles.mockReviewCard}>
                  <View style={styles.starsRow}>
                    <Ionicons name="star" size={16} color="#FBBF24" />
                    <Ionicons name="star" size={16} color="#FBBF24" />
                    <Ionicons name="star" size={16} color="#FBBF24" />
                    <Ionicons name="star" size={16} color="#FBBF24" />
                    <Ionicons name="star" size={16} color="#FBBF24" />
                  </View>
                  <Text style={styles.reviewText}>Great person to deal with!</Text>
                </View>
             ) : (
                <Text style={styles.emptyText}>No reviews yet.</Text>
             )}
          </View>
          
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  headerGradient: { height: 200, padding: theme.spacing.lg, paddingTop: 50 },
  headerTopActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  bodyContent: { flex: 1, backgroundColor: theme.colors.white, paddingHorizontal: theme.spacing.lg },
  
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.white, marginTop: -50, alignSelf: 'center', borderWidth: 4, borderColor: theme.colors.white, ...theme.shadows.md, elevation: 5 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 50, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...theme.typography.h1, color: theme.colors.white },
  
  userInfoContainer: { alignItems: 'center', marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
  nameText: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 4 },
  emailText: { ...theme.typography.bodyMd, color: theme.colors.textMuted, marginBottom: 8 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.lg },
  verifiedText: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: 'bold' },
  
  editProfileBtn: { paddingHorizontal: theme.spacing.xl, paddingVertical: 10, borderRadius: theme.borderRadius.pill, borderWidth: 1.5, borderColor: theme.colors.primary },
  editProfileBtnText: { ...theme.typography.labelBold, color: theme.colors.primary },
  
  statsContainer: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  statCard: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  statValue: { ...theme.typography.h2, color: theme.colors.primary, marginBottom: 4 },
  statLabel: { ...theme.typography.caption, color: theme.colors.textMuted },
  
  sectionContainer: { marginBottom: theme.spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text },
  seeAllText: { ...theme.typography.labelBold, color: theme.colors.primary },
  
  horizontalScroll: { overflow: 'visible' },
  mockListingCard: { width: 140, marginRight: theme.spacing.md },
  mockListingImage: { width: 140, height: 100, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.md, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  mockListingTitle: { ...theme.typography.labelBold, color: theme.colors.text },
  emptyText: { ...theme.typography.bodyMd, color: theme.colors.textMuted, fontStyle: 'italic' },
  
  mockReviewCard: { backgroundColor: theme.colors.background, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: 8 },
  reviewText: { ...theme.typography.bodyMd, color: theme.colors.text },
  
  addressCard: { backgroundColor: theme.colors.background, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.md },
  defaultBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: theme.colors.primary + '20', color: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, ...theme.typography.caption, fontWeight: 'bold' },
  addressName: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 4 },
  addressPreview: { ...theme.typography.bodySm, color: theme.colors.textMuted, marginBottom: 12 },
  addressActions: { flexDirection: 'row', alignItems: 'center' },
  editBtnText: { ...theme.typography.labelBold, color: theme.colors.primary, fontSize: 13 },
  addAddressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, gap: 8 },
  addAddressBtnText: { ...theme.typography.labelBold, color: theme.colors.text },
});
