import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Share, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  const [profile, setProfile] = useState<any>(null);
  
  // Toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [distanceUnit, setDistanceUnit] = useState('km');

  useEffect(() => {
    fetchUser();
    loadPreferences();
  }, []);

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
    }
  };

  const loadPreferences = async () => {
    const unit = await AsyncStorage.getItem('distanceUnit');
    if (unit) setDistanceUnit(unit);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() }
    ]);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const SettingRow = ({ icon, label, rightText, onPress, isToggle, toggleValue, onToggleChange }: any) => (
    <TouchableOpacity style={styles.row} onPress={isToggle ? undefined : onPress} activeOpacity={isToggle ? 1 : 0.7}>
      <View style={styles.rowLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {rightText && <Text style={styles.rightText}>{rightText}</Text>}
        {isToggle ? (
          <Switch 
            value={toggleValue} 
            onValueChange={onToggleChange} 
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* User Mini Profile Card */}
        {profile && (
           <View style={styles.profileCard}>
             <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{getInitials(profile.full_name)}</Text>
             </View>
             <View style={styles.profileInfo}>
               <Text style={styles.profileName}>{profile.full_name}</Text>
               <Text style={styles.profileEmail}>{profile.email || 'Email linked'}</Text>
             </View>
             <TouchableOpacity style={styles.profileEditBtn} onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.profileEditBtnText}>Edit</Text>
             </TouchableOpacity>
           </View>
        )}

        <SectionHeader title="Account" />
        <View style={styles.sectionCard}>
          <SettingRow icon="person-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <View style={styles.divider} />
          <SettingRow icon="lock-closed-outline" label="Change Password" onPress={() => Alert.alert('Information', 'Please sign out and use the Forgot Password flow.')} />
          <View style={styles.divider} />
          <SettingRow icon="shield-checkmark-outline" label="Verify Identity" onPress={() => Alert.alert('Coming Soon')} />
        </View>

        <SectionHeader title="Notifications" />
        <View style={styles.sectionCard}>
          <SettingRow icon="notifications-outline" label="Push Notifications" isToggle toggleValue={pushEnabled} onToggleChange={setPushEnabled} />
          <View style={styles.divider} />
          <SettingRow icon="mail-outline" label="Email Alerts" isToggle toggleValue={emailEnabled} onToggleChange={setEmailEnabled} />
          <View style={styles.divider} />
          <SettingRow icon="chatbox-outline" label="SMS Alerts" isToggle toggleValue={smsEnabled} onToggleChange={setSmsEnabled} />
        </View>

        <SectionHeader title="Preferences" />
        <View style={styles.sectionCard}>
          <SettingRow icon="globe-outline" label="Language" rightText="English" onPress={() => Alert.alert('Coming Soon')} />
          <View style={styles.divider} />
          <SettingRow icon="cash-outline" label="Currency" rightText="₹ INR" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="moon-outline" label="Dark Mode" isToggle toggleValue={darkMode} onToggleChange={setDarkMode} />
        </View>

        <SectionHeader title="Support" />
        <View style={styles.sectionCard}>
          <SettingRow icon="help-circle-outline" label="Help Center" onPress={() => Alert.alert('Coming Soon')} />
          <View style={styles.divider} />
          <SettingRow icon="warning-outline" label="Report a Problem" onPress={() => Alert.alert('Coming Soon')} />
          <View style={styles.divider} />
          <SettingRow icon="star-outline" label="Rate the App" onPress={() => Alert.alert('Thank you!', 'We appreciate your support.')} />
        </View>

        <SectionHeader title="Legal" />
        <View style={styles.sectionCard}>
          <SettingRow icon="document-text-outline" label="Privacy Policy" onPress={() => Alert.alert('Coming Soon')} />
          <View style={styles.divider} />
          <SettingRow icon="newspaper-outline" label="Terms of Service" onPress={() => Alert.alert('Coming Soon')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>RentEase Version 1.0.0 (Preview)</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtnWrapper: { width: 40, height: 40, justifyContent: 'center' },
  title: { ...theme.typography.h3, color: theme.colors.text },
  
  content: { flex: 1, padding: theme.spacing.lg },
  
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, padding: theme.spacing.md, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  profileAvatarText: { ...theme.typography.h2, color: theme.colors.primary },
  profileInfo: { flex: 1 },
  profileName: { ...theme.typography.labelBold, color: theme.colors.text, fontSize: 16, marginBottom: 2 },
  profileEmail: { ...theme.typography.caption, color: theme.colors.textMuted },
  profileEditBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.borderRadius.pill, backgroundColor: theme.colors.background },
  profileEditBtnText: { ...theme.typography.labelBold, color: theme.colors.primary, fontSize: 13 },
  
  sectionHeader: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 12, marginLeft: 4, fontSize: 15 },
  sectionCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginLeft: 52 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: theme.spacing.md },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: theme.colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  label: { ...theme.typography.bodyMd, color: theme.colors.text, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rightText: { ...theme.typography.caption, color: theme.colors.textMuted, marginRight: 8 },
  
  logoutBtn: { width: '100%', paddingVertical: 16, borderRadius: theme.borderRadius.pill, borderWidth: 1.5, borderColor: theme.colors.error, alignItems: 'center', marginVertical: theme.spacing.lg },
  logoutBtnText: { ...theme.typography.labelBold, color: theme.colors.error, fontSize: 16 },
  
  versionText: { ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.xl },
});
