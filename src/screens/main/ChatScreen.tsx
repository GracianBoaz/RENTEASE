import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { SharedStackParamList } from '../../navigation/MainNavigator';
import { theme } from '../../constants/theme';
import { supabase } from '../../utils/supabase';
import { MessageSuggestions } from '../../components/MessageSuggestions';

type ChatRouteProp = RouteProp<SharedStackParamList, 'Chat'>;
type NavigationProp = NativeStackNavigationProp<SharedStackParamList, 'Chat'>;

export default function ChatScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { otherId, itemId, otherName, itemTitle, otherAvatar } = route.params;

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUserId(data.session.user.id);
        fetchMessages(data.session.user.id);
        markAsRead(data.session.user.id);
        setupRealtime(data.session.user.id);
      }
    });

    return () => {
      supabase.channel('messages').unsubscribe();
    };
  }, []);

  const fetchMessages = async (uid: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(full_name)')
      .or(`and(sender_id.eq.${uid},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${uid})`)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false }); // descending for inverted FlatList
    
    if (data) setMessages(data);
  };

  const markAsRead = async (uid: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('receiver_id', uid).eq('sender_id', otherId);
  };

  const setupRealtime = (uid: string) => {
    supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        if (
          (newMsg.sender_id === uid && newMsg.receiver_id === otherId) ||
          (newMsg.sender_id === otherId && newMsg.receiver_id === uid)
        ) {
          setMessages((prev) => [newMsg, ...prev]);
        }
      })
      .subscribe();
  };

  const handleSend = async () => {
    if (!inputText.trim() || !userId) return;
    const content = inputText;
    setInputText('');
    
    await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: otherId,
      item_id: itemId,
      content,
      is_read: false,
    });
  };

  const attachImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setInputText('[Image attached]');
    }
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMine = item.sender_id === userId;
    
    let showDate = false;
    let dateStr = '';
    
    if (index === messages.length - 1) {
      showDate = true;
    } else {
      const prevDate = new Date(messages[index + 1].created_at).toDateString();
      const currDate = new Date(item.created_at).toDateString();
      if (prevDate !== currDate) showDate = true;
    }

    if (showDate) {
      const today = new Date().toDateString();
      const currDate = new Date(item.created_at);
      if (currDate.toDateString() === today) {
        dateStr = 'Today';
      } else {
        dateStr = currDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }

    return (
      <View>
        {showDate && (
           <View style={styles.dateSeparatorContainer}>
             <Text style={styles.dateSeparatorText}>{dateStr}</Text>
           </View>
        )}
        <View style={[styles.msgWrapper, isMine ? styles.msgWrapperMine : styles.msgWrapperOther]}>
          <View style={[styles.msgBubble, isMine ? styles.msgBubbleMine : styles.msgBubbleOther]}>
            <Text style={[styles.msgText, isMine ? styles.msgTextMine : styles.msgTextOther]}>{item.content}</Text>
          </View>
          <Text style={styles.msgTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtnWrapper} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerAvatarContainer}>
           {otherAvatar ? (
             <Image source={{ uri: otherAvatar }} style={styles.headerAvatar} />
           ) : (
             <View style={[styles.headerAvatar, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
               <Text style={{ ...theme.typography.labelBold, color: theme.colors.primary }}>{otherName?.substring(0, 2).toUpperCase()}</Text>
             </View>
           )}
           <View style={styles.onlineDot} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherName}</Text>
          <Text style={styles.headerItem}>{itemTitle}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        inverted
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <MessageSuggestions 
        itemId={itemId}
        receiverRole="owner"
        onSelect={(msg) => setInputText(msg)}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputArea}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachBtn} onPress={attachImage}>
              <Ionicons name="attach" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
            
            <TextInput 
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()}>
              <LinearGradient 
                colors={inputText.trim() ? [theme.colors.primary, theme.colors.secondary] : [theme.colors.border, theme.colors.border]} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={styles.sendBtn}
              >
                <Ionicons name="send" size={16} color={inputText.trim() ? theme.colors.white : theme.colors.textMuted} style={{ marginLeft: 4 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtnWrapper: { padding: theme.spacing.sm, marginRight: 8 },
  headerAvatarContainer: { position: 'relative', marginRight: 12 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22 },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: theme.colors.white },
  headerInfo: { flex: 1 },
  headerName: { ...theme.typography.labelBold, color: theme.colors.text, marginBottom: 2 },
  headerItem: { ...theme.typography.caption, color: theme.colors.textMuted },
  
  listContent: { padding: theme.spacing.lg },
  dateSeparatorContainer: { alignSelf: 'center', backgroundColor: theme.colors.background, paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.borderRadius.pill, marginVertical: theme.spacing.md },
  dateSeparatorText: { ...theme.typography.caption, color: theme.colors.textMuted },
  
  msgWrapper: { marginBottom: theme.spacing.md, maxWidth: '80%' },
  msgWrapperMine: { alignSelf: 'flex-end' },
  msgWrapperOther: { alignSelf: 'flex-start' },
  msgBubble: { paddingHorizontal: theme.spacing.lg, paddingVertical: 12 },
  msgBubbleMine: { backgroundColor: theme.colors.primary, borderRadius: 20, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: theme.colors.white, borderRadius: 20, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.sm },
  msgText: { ...theme.typography.bodyMd },
  msgTextMine: { color: theme.colors.white },
  msgTextOther: { color: theme.colors.text },
  msgTime: { ...theme.typography.caption, color: theme.colors.textMuted, marginTop: 4, alignSelf: 'flex-end', fontSize: 10 },
  
  inputArea: { backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, padding: theme.spacing.md, paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.md },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: theme.colors.background, borderRadius: 24, paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1, borderColor: theme.colors.border },
  attachBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: 8, paddingTop: 10, paddingBottom: 10, color: theme.colors.text, ...theme.typography.bodyMd },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
