import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Image } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';

type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'MessagesList'>;

export default function MessagesListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUserId(data.session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (userId && isFocused) {
      fetchConversations();
    }
  }, [userId, isFocused]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredConversations(conversations.filter(c => 
        c.partner?.full_name?.toLowerCase().includes(q) || 
        c.items?.title?.toLowerCase().includes(q)
      ));
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(full_name, avatar_url),
          receiver:profiles!receiver_id(full_name, avatar_url),
          items(title, images)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const map = new Map();
      data?.forEach((msg: any) => {
        const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const itemId = msg.item_id;
        const key = `${partnerId}_${itemId}`;

        if (!map.has(key)) {
          const isUnread = msg.receiver_id === userId && !msg.is_read;
          map.set(key, {
            ...msg,
            partnerId,
            unreadCount: isUnread ? 1 : 0,
            partner: msg.sender_id === userId ? msg.receiver : msg.sender,
          });
        } else {
          if (msg.receiver_id === userId && !msg.is_read) {
            const existing = map.get(key);
            existing.unreadCount += 1;
            map.set(key, existing);
          }
        }
      });

      const convos = Array.from(map.values());
      setConversations(convos);
      setFilteredConversations(convos);
    } catch (err) {
      console.log('Error fetching messages', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
       if (hours === 0) return 'Just now';
       return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getImages = (images: any): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(Boolean);
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles.searchContainer}>
         <Ionicons name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
         <TextInput 
           style={styles.searchInput}
           placeholder="Search conversations..."
           placeholderTextColor={theme.colors.textMuted}
           value={searchQuery}
           onChangeText={setSearchQuery}
         />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.border} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>Conversations will appear here once you contact owners or renters.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const images = getImages(item.items?.images);
            const itemImage = images.length > 0 ? images[0] : null;
            return (
              <TouchableOpacity 
                style={styles.convCard}
                onPress={() => navigation.navigate('Chat', { 
                  otherId: item.partnerId, 
                  itemId: item.item_id, 
                  otherName: item.partner?.full_name,
                  itemTitle: item.items?.title,
                  otherAvatar: item.partner?.avatar_url
                })}
              >
                <View style={styles.avatar}>
                  {item.partner?.avatar_url ? (
                    <Image source={{ uri: item.partner.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{getInitials(item.partner?.full_name)}</Text>
                  )}
                </View>
                
                <View style={styles.convDetails}>
                  <View style={styles.convHeader}>
                    <Text style={[styles.partnerName, item.unreadCount > 0 && styles.textBold]}>{item.partner?.full_name}</Text>
                    <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
                  </View>
                  <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.textBold]} numberOfLines={1}>{item.content}</Text>
                </View>

                <View style={styles.rightInfo}>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  )}
                  {itemImage && (
                     <Image source={{ uri: itemImage }} style={styles.itemThumb} />
                  )}
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  header: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.white },
  title: { ...theme.typography.h2, color: theme.colors.text },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md, paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.md, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, ...theme.typography.bodyMd, color: theme.colors.text },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.text, marginTop: theme.spacing.md, marginBottom: theme.spacing.xs },
  emptySubtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted, textAlign: 'center' },
  
  listContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  convCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  avatarImage: { width: '100%', height: '100%', borderRadius: 26 },
  avatarText: { ...theme.typography.h3, color: theme.colors.primary },
  
  convDetails: { flex: 1, marginRight: theme.spacing.sm },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  partnerName: { ...theme.typography.labelBold, color: theme.colors.text, fontSize: 16 },
  textBold: { fontWeight: 'bold', color: theme.colors.text },
  timeAgo: { ...theme.typography.caption, color: theme.colors.textMuted },
  lastMessage: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  
  rightInfo: { alignItems: 'flex-end', justifyContent: 'center', gap: 6 },
  unreadBadge: { backgroundColor: theme.colors.primary, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  unreadText: { ...theme.typography.caption, color: theme.colors.white, fontWeight: 'bold' },
  itemThumb: { width: 36, height: 36, borderRadius: 8, backgroundColor: theme.colors.background },
});
