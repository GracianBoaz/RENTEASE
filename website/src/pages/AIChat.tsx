import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { askGemini } from '../geminiClient';
import { Send, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hi! 👋 I'm your RentEase AI Assistant. I can recommend listings, explain booking terms, and check rental rules. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user || null);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Fetch Supabase context
      const { data: items } = await supabase
        .from('items')
        .select('title, category_id, price_per_day, location_city')
        .eq('is_available', true)
        .limit(15);

      let profile = null;
      if (currentUser?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('role, location_name')
          .eq('id', currentUser.id)
          .single();
        profile = data;
      }

      const prompt = `
You are a helpful AI assistant for RentEase - peer-to-peer rental marketplace app in India.
User Profile: ${JSON.stringify(profile)}
Available listings sample: ${JSON.stringify(items)}

Rules:
- Be friendly, helpful, and concise (max 3 sentences)
- Use relevant emojis
- Give specific advice based on the context
- If asked about items, mention relevant ones from the list

User Question: "${textToSend}"
Respond helpfully:`;

      const response = await askGemini(prompt);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response || "Sorry, I couldn't process that. Please try again!",
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now.",
        sender: 'ai',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>AIChat Assistant</span>
        <Sparkles size={24} style={{ color: 'var(--secondary)' }} />
      </h1>
      <p className="page-desc">Ask queries regarding nearby gear availability, rental durations, trust systems, and pricing rules.</p>

      <div className="chat-container">
        <div className="chat-pane">
          <div className="chat-messages">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`chat-bubble ${msg.sender === 'user' ? 'chat-user' : 'chat-ai'}`}
              >
                {msg.text.split('\n').map((para, i) => (
                  <p key={i} style={{ marginBottom: i < msg.text.split('\n').length - 1 ? '8px' : 0 }}>
                    {para}
                  </p>
                ))}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble chat-ai" style={{ opacity: 0.6 }}>
                Thinking...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="app-suggestions" style={{ background: 'transparent', borderTop: 'none', padding: '0 24px 12px' }}>
            <div className="suggestion-chips">
              <span className="chip" onClick={() => handleSendMessage("Show me scooters and vehicles nearby")}>🛵 Rent EVs</span>
              <span className="chip" onClick={() => handleSendMessage("Are there any cameras listed?")}>📸 Cameras</span>
              <span className="chip" onClick={() => handleSendMessage("What is the booking security policy?")}>🔒 Security Policies</span>
            </div>
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
            className="chat-input-bar"
          >
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ask the assistant anything..." 
              style={{ flex: 1 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)',
                color: '#FFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
