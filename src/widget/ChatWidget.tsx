import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Styles
import '../index.css';

interface ChatWidgetProps {
  userId: string;
  visitorId: string;
}

interface Message {
  id?: string;
  sender: 'user' | 'visitor';
  text: string;
  timestamp: Date;
}

interface WidgetSettings {
  business_name: string;
  sales_representative: string;
  welcome_message: string;
  primary_color: string;
  secondary_color: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ userId, visitorId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [settings, setSettings] = useState<WidgetSettings>({
    business_name: 'Business Chat',
    sales_representative: 'Support Agent',
    welcome_message: 'Hello! How can I help you today?',
    primary_color: '#4f46e5',
    secondary_color: '#ffffff'
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLiveAgent, setIsLiveAgent] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const messagesSubscription = useRef<any>(null);

  useEffect(() => {
    // Fetch widget settings
    fetchWidgetSettings();
    
    return () => {
      if (messagesSubscription.current) {
        messagesSubscription.current.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && !sessionId) {
      // Create or get existing chat session
      createOrGetSession();
    }
  }, [isOpen]);

  useEffect(() => {
    if (sessionId) {
      // Subscribe to messages for this session
      subscribeToMessages();
      
      // Check if there's a live agent
      checkLiveAgentStatus();
    }
  }, [sessionId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const fetchWidgetSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching widget settings:', error);
        return;
      }
      
      if (data) {
        setSettings({
          business_name: data.business_name || 'Business Chat',
          sales_representative: data.sales_representative || 'Support Agent',
          welcome_message: data.welcome_message || 'Hello! How can I help you today?',
          primary_color: data.primary_color || '#4f46e5',
          secondary_color: data.secondary_color || '#ffffff'
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrGetSession = async () => {
    try {
      // Check for existing active session
      const { data: existingSessions, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('visitor_id', visitorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (fetchError) {
        console.error('Error fetching sessions:', fetchError);
        return;
      }
      
      if (existingSessions && existingSessions.length > 0) {
        // Use existing session
        setSessionId(existingSessions[0].id);
        
        // Fetch existing messages
        const { data: existingMessages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', existingSessions[0].id)
          .order('created_at', { ascending: true });
        
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }
        
        if (existingMessages) {
          const formattedMessages = existingMessages.map(msg => ({
            id: msg.id,
            sender: msg.sender_type === 'visitor' ? 'visitor' : 'user',
            text: msg.message,
            timestamp: new Date(msg.created_at)
          }));
          
          setMessages(formattedMessages);
        }
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: userId,
            visitor_id: visitorId,
            is_active: true
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating session:', createError);
          return;
        }
        
        if (newSession) {
          setSessionId(newSession.id);
          
          // Add welcome message
          const { error: welcomeError } = await supabase
            .from('chat_messages')
            .insert({
              session_id: newSession.id,
              sender_type: 'user',
              message: settings.welcome_message
            });
          
          if (welcomeError) {
            console.error('Error sending welcome message:', welcomeError);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!sessionId) return;
    
    if (messagesSubscription.current) {
      messagesSubscription.current.unsubscribe();
    }
    
    messagesSubscription.current = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = payload.new;
          
          setMessages(prev => [
            ...prev,
            {
              id: newMessage.id,
              sender: newMessage.sender_type === 'visitor' ? 'visitor' : 'user',
              text: newMessage.message,
              timestamp: new Date(newMessage.created_at)
            }
          ]);
        }
      )
      .subscribe();
  };

  const checkLiveAgentStatus = async () => {
    if (!sessionId) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('is_active')
        .eq('id', sessionId)
        .single();
      
      if (error) {
        console.error('Error checking live agent status:', error);
        return;
      }
      
      setIsLiveAgent(data.is_active);
      
      // Subscribe to session changes
      supabase
        .channel('session_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_sessions',
            filter: `id=eq.${sessionId}`
          },
          (payload) => {
            setIsLiveAgent(payload.new.is_active);
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !sessionId) return;
    
    try {
      // Add message to UI immediately for better UX
      const newMessage: Message = {
        sender: 'visitor',
        text: inputText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      // Send message to server
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: 'visitor',
          message: inputText
        });
      
      if (error) {
        console.error('Error sending message:', error);
        return;
      }
      
      // Update session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      
      // If no live agent, process auto-replies
      if (!isLiveAgent) {
        processAutoReplies(inputText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const processAutoReplies = async (message: string) => {
    try {
      // First check for advanced replies
      const { data: advancedReplies, error: advancedError } = await supabase
        .from('advanced_replies')
        .select('*')
        .eq('user_id', userId);
      
      if (advancedError) {
        console.error('Error fetching advanced replies:', advancedError);
      } else if (advancedReplies && advancedReplies.length > 0) {
        // Check for keyword matches
        for (const reply of advancedReplies) {
          if (keywordMatches(message, reply.keywords, reply.matching_type)) {
            // Send advanced reply
            await supabase
              .from('chat_messages')
              .insert({
                session_id: sessionId,
                sender_type: 'advanced_reply',
                message: reply.response
              });
            
            return; // Stop after first match
          }
        }
      }
      
      // Then check for auto replies
      const { data: autoReplies, error: autoError } = await supabase
        .from('auto_replies')
        .select('*')
        .eq('user_id', userId);
      
      if (autoError) {
        console.error('Error fetching auto replies:', autoError);
      } else if (autoReplies && autoReplies.length > 0) {
        // Check for keyword matches
        for (const reply of autoReplies) {
          if (keywordMatches(message, reply.keywords, reply.matching_type)) {
            // Send auto reply
            await supabase
              .from('chat_messages')
              .insert({
                session_id: sessionId,
                sender_type: 'auto_reply',
                message: reply.response
              });
            
            return; // Stop after first match
          }
        }
      }
      
      // If no matches, check if AI mode is enabled
      const { data: aiSettings, error: aiError } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (aiError) {
        console.error('Error fetching AI settings:', aiError);
      } else if (aiSettings && aiSettings.is_enabled && aiSettings.api_key) {
        // Send "thinking" message
        await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            sender_type: 'ai',
            message: 'Thinking...'
          });
        
        // In a real implementation, you would call the AI API here
        // For this demo, we'll simulate an AI response after a delay
        setTimeout(async () => {
          await supabase
            .from('chat_messages')
            .insert({
              session_id: sessionId,
              sender_type: 'ai',
              message: `AI response based on: "${aiSettings.context_info.substring(0, 50)}..."`
            });
        }, 2000);
      } else {
        // Default fallback message
        await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            sender_type: 'auto_reply',
            message: "Thanks for your message! We'll get back to you soon."
          });
      }
    } catch (error) {
      console.error('Error processing replies:', error);
    }
  };

  const keywordMatches = (message: string, keywords: string[], matchingType: string): boolean => {
    const normalizedMessage = message.toLowerCase();
    
    switch (matchingType) {
      case 'word_match':
        return keywords.some(keyword => 
          normalizedMessage.includes(keyword.toLowerCase())
        );
      
      case 'fuzzy_match':
        return keywords.some(keyword => {
          const distance = levenshteinDistance(normalizedMessage, keyword.toLowerCase());
          return distance <= 2; // Allow up to 2 character differences
        });
      
      case 'regex_match':
        return keywords.some(keyword => {
          try {
            const regex = new RegExp(keyword, 'i');
            return regex.test(normalizedMessage);
          } catch (e) {
            console.error('Invalid regex:', keyword);
            return false;
          }
        });
      
      case 'synonym_match':
        // In a real implementation, you would use a synonym API or dictionary
        // For this demo, we'll just do a simple word match
        return keywords.some(keyword => 
          normalizedMessage.includes(keyword.toLowerCase())
        );
      
      default:
        return false;
    }
  };

  // Simple Levenshtein distance implementation for fuzzy matching
  const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  if (loading) {
    return null;
  }

  return (
    <div className="widget-container">
      {isOpen && (
        <div className="chat-window">
          <div 
            className="chat-header"
            style={{ backgroundColor: settings.primary_color, color: settings.secondary_color }}
          >
            {settings.business_name}
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`message ${msg.sender === 'visitor' ? 'user-message' : 'bot-message'}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
            />
            <button
              onClick={handleSendMessage}
              style={{ backgroundColor: settings.primary_color, color: settings.secondary_color }}
            >
              Send
            </button>
          </div>
        </div>
      )}
      
      <div
        className="chat-button"
        onClick={toggleChat}
        style={{ backgroundColor: settings.primary_color, color: settings.secondary_color }}
      >
        {isOpen ? '✕' : '💬'}
      </div>
    </div>
  );
};

export default ChatWidget;