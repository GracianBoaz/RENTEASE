import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setEmail(session.user.email || '');

    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url);
    }
    setLoading(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setSaving(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split('.').pop() || 'jpg';
      const fileName = `avatars/${profile.id}.${ext}`;
      
      const { error } = await supabase.storage.from('item-images').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      
      const { data } = supabase.storage.from('item-images').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      phone,
      bio,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);

    setSaving(false);
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      navigation.goBack();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials(fullName)}</Text>
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="pencil" size={14} color={theme.colors.white} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={[styles.input, focusedInput === 'name' && styles.inputFocused]}
              placeholderTextColor={theme.colors.textMuted}
              value={fullName} 
              onChangeText={setFullName} 
              onFocus={() => setFocusedInput('name')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={[styles.input, styles.inputDisabled]}
              value={email} 
              editable={false} 
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
              style={[styles.input, focusedInput === 'phone' && styles.inputFocused]}
              placeholderTextColor={theme.colors.textMuted}
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad" 
              onFocus={() => setFocusedInput('phone')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio (Optional)</Text>
            <TextInput 
              style={[styles.input, styles.textArea, focusedInput === 'bio' && styles.inputFocused]}
              placeholderTextColor={theme.colors.textMuted}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell renters about yourself..."
              multiline
              numberOfLines={4}
              onFocus={() => setFocusedInput('bio')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveBtn}>
            {saving ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  header: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtnWrapper: { width: 40, height: 40, justifyContent: 'center' },
  title: { ...theme.typography.h3, color: theme.colors.text },
  content: { flex: 1, padding: theme.spacing.lg },
  
  avatarSection: { alignItems: 'center', marginVertical: theme.spacing.xl },
  avatarWrapper: { position: 'relative' },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { ...theme.typography.h1, color: theme.colors.primary },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: theme.colors.white },
  
  inputContainer: { marginBottom: theme.spacing.lg },
  label: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 8 },
  input: { height: 56, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, backgroundColor: theme.colors.white, ...theme.typography.bodyMd, color: theme.colors.text },
  inputFocused: { borderColor: theme.colors.primary, backgroundColor: theme.colors.white },
  inputDisabled: { backgroundColor: theme.colors.background, color: theme.colors.textMuted },
  textArea: { height: 120, textAlignVertical: 'top', paddingVertical: theme.spacing.md },
  
  footer: { padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.lg },
  saveBtn: { height: 56, borderRadius: theme.borderRadius.pill, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { ...theme.typography.labelBold, color: theme.colors.white, fontSize: 18 },
});
