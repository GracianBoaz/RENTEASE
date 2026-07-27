import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { theme } from '../constants/theme';
import AddressForm from './AddressForm';

export interface UserAddress {
  id?: string;
  user_id?: string;
  name: string;
  mobile: string;
  flat_house_no: string;
  area_street_village: string;
  landmark?: string;
  pincode: string;
  town_city: string;
  state: string;
  location_lat?: number;
  location_lng?: number;
  is_default?: boolean;
}

interface AddressManagerProps {
  onAddressSelected: (address: UserAddress) => void;
}

export default function AddressManager({ onAddressSelected }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      
      if (!data || data.length === 0) {
        setShowForm(true);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = (address: UserAddress) => {
    setShowForm(false);
    setEditingAddress(null);
    fetchAddresses();
    // Also auto-select the newly saved address
    onAddressSelected(address);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 40 }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (showForm || editingAddress) {
    return (
      <AddressForm 
        onAddressSelected={onAddressSelected} 
        onSave={handleSaveForm}
        onCancel={addresses.length > 0 ? handleCancelForm : undefined}
        initialValues={editingAddress || undefined}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>📍 Select Item Location</Text>
      
      {addresses.map((address) => (
        <View key={address.id || Math.random().toString()} style={[styles.addressCard, address.is_default && styles.defaultCard]}>
          <View style={styles.addressHeaderRow}>
            <View style={styles.addressTitleRow}>
              <Ionicons 
                name={address.is_default ? "radio-button-on" : "radio-button-off"} 
                size={20} 
                color={address.is_default ? theme.colors.primary : theme.colors.textMuted} 
              />
              <Text style={styles.addressType}>{address.is_default ? 'Default Address' : 'Saved Address'}</Text>
            </View>
          </View>
          
          <View style={styles.addressDetails}>
            <Text style={styles.contactText}>{address.name} | {address.mobile}</Text>
            <Text style={styles.addressText}>{address.flat_house_no}, {address.area_street_village}</Text>
            {address.landmark ? <Text style={styles.addressText}>Landmark: {address.landmark}</Text> : null}
            <Text style={styles.addressText}>{address.town_city}, {address.state} — {address.pincode}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => onAddressSelected(address)}
            >
              <Text style={styles.actionBtnText}>Use This</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.editBtn]} 
              onPress={() => setEditingAddress(address)}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity 
        style={styles.addNewBtn}
        onPress={() => setShowForm(true)}
      >
        <Ionicons name="add" size={20} color={theme.colors.text} />
        <Text style={styles.addNewBtnText}>Add New Address</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.md,
  },
  addressCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  defaultCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '0A',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressType: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
  },
  addressDetails: {
    paddingLeft: 28,
    marginBottom: 12,
  },
  contactText: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  addressText: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    paddingLeft: 28,
    gap: 12,
  },
  actionBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
  },
  actionBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.white,
    fontSize: 13,
  },
  editBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
    fontSize: 13,
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  addNewBtnText: {
    ...theme.typography.labelBold,
    color: theme.colors.text,
  },
});
