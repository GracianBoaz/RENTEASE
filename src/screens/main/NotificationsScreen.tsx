import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'Notifications'>;

const FILTERS = ['All', 'Bookings', 'Messages', 'Offers', 'System'];

const NOTIF_STYLES: any = {
  booking: { bg: '#E8F5E9', icon: '📋' },
  message: { bg: '#E3F2FD', icon: '💬' },
  review: { bg: '#FFF9E6', icon: '⭐' },
  offer: { bg: '#F3E5F5', icon: '🏷️' },
  system: { bg: '#F0EEF4', icon: '🔔' },
};

export default function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUserId(data.session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (userId && isFocused) {
      fetchAndMarkRead();
    }
  }, [userId, isFocused]);

  const fetchAndMarkRead = async () => {
    setLoading(true);
    
    // Auto-mark unread as read
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);

    // Fetch
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
    setLoading(false);
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours || 1}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Bookings' && n.type === 'booking') return true;
    if (activeFilter === 'Messages' && n.type === 'message') return true;
    if (activeFilter === 'Offers' && n.type === 'offer') return true;
    if (activeFilter === 'System' && n.type === 'system') return true;
    return false;
  });

  const handlePress = (item: any) => {
    if (item.type === 'booking') navigation.navigate('RentalsMain');
    if (item.type === 'message') navigation.navigate('MessagesList');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <TouchableOpacity onPress={fetchAndMarkRead}>
          <Text style={styles.markReadBtn}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(i) => i}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>You will be notified about bookings, messages and more</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const style = NOTIF_STYLES[item.type] || NOTIF_STYLES.system;
            return (
              <TouchableOpacity style={[styles.notifItem, !item.is_read && styles.notifUnread]} onPress={() => handlePress(item)}>
                <View style={[styles.iconCircle, { backgroundColor: style.bg }]}>
                  <Text>{style.icon}</Text>
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifBody}>{item.body}</Text>
                  <Text style={styles.notifTime}>{getTimeAgo(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { fontSize: 24, color: theme.colors.text, marginRight: theme.spacing.md },
  title: { ...theme.typography.h3, color: theme.colors.text },
  markReadBtn: { color: theme.colors.primary, fontSize: 13, fontWeight: 'bold' },
  filtersContainer: { backgroundColor: theme.colors.white, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.background, marginRight: 8 },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterText: { ...theme.typography.caption, color: theme.colors.text },
  filterTextActive: { color: theme.colors.white, fontWeight: 'bold' },
  notifItem: { flexDirection: 'row', padding: 16, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  notifUnread: { backgroundColor: '#F5F3FF', borderLeftWidth: 3, borderLeftColor: theme.colors.primary },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifTitle: { fontWeight: '700', fontSize: 14, color: theme.colors.text, marginBottom: 4 },
  notifBody: { color: '#6B6478', fontSize: 13, marginBottom: 8 },
  notifTime: { color: '#A09AB0', fontSize: 11 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: 8 },
  emptySubtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted, textAlign: 'center' },
});
