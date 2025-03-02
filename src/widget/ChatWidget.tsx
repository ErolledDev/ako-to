import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MessageSquare, Send, X, Loader } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Define types
interface ChatWidgetProps {
  userId: string;
  visitorId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

interface WidgetSettings {
  business_name: string;
  sales_representative: string;
  welcome_message: string;
  primary_color: string;
  secondary_color: string;
}

interface ChatMessage {
  id?: string;
  sender_type: 'user' | 'visitor' | 'ai' | 'auto_reply' | 'advanced_reply';
  message: string;
  created_at?: string;
}

// Create Supabase client
const supabaseUrl = 'https://drxjazbhjumeezoifcmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyeGphemJoanVtZWV6b2lmY21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NDg2NjcsImV4cCI6MjA1NjQyNDY2N30.3O8fxkGWv88Ydo_80hO0S2Qz88T4WKNIosOf1UNeyeA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ChatWidget: React.FC<ChatWidgetProps> = ({ userId, visitorId, position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<WidgetSettings>({
    business_name: 'Business Chat',
    sales_representative: '',
    welcome_message: 'Hello! How can I help you today?',
    primary_color: '#4f46e5',
    secondary_color: '#ffffff'
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesSubscription = useRef<any>(null);

  useEffect(() => {
    fetchWidgetSettings();
    initializeSession();
    
    return () => {
      if (messagesSubscription.current) {
        messagesSubscription.current.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const fetchWidgetSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setSettings({
          business_name: data.business_name || 'Business Chat',
          sales_representative: data.sales_representative || '',
          welcome_message: data.welcome_message || 'Hello! How can I help you today?',
          primary_color: data.primary_color || '#4f46e5',
          secondary_color: data.secondary_color || '#ffffff'
        });
      }
    } catch (error) {
      console.error('Error fetching widget settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSession = async () => {
    try {
      // Check for existing session in localStorage
      const storedSessionId = localStorage.getItem(`chat_session_${userId}`);
      
      if (storedSessionId) {
        // Verify if session exists and is active
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('id', storedSessionId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (sessionError) throw sessionError;
        
        if (sessionData) {
          setSessionId(storedSessionId);
          return;
        }
      }
      
      // Create new session
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          visitor_id: visitorId,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setSessionId(data.id);
      localStorage.setItem(`chat_session_${userId}`, data.id);
    } catch (error) {
      console.error('Error initializing chat session:', error);
      // Retry with exponential backoff if needed
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          initializeSession();
        }, 1000 * Math.pow(2, retryCount));
      }
    }
  };

  const fetchMessages = async () => {
    if (!sessionId) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setMessages(data);
      } else {
        // Add welcome message if no messages exist
        const welcomeMessage: ChatMessage = {
          sender_type: 'user',
          message: settings.welcome_message
        };
        
        await sendMessage(welcomeMessage);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
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
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();
  };

  const sendMessage = async (msg: ChatMessage) => {
    if (!sessionId) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: msg.sender_type,
          message: msg.message
        });
      
      if (error) throw error;
      
      // Update session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error; // Re-throw to handle in the calling function
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !sessionId) return;
    
    try {
      setSending(true);
      setError(null);
      
      // Send visitor message
      await sendMessage({
        sender_type: 'visitor',
        message: message.trim()
      });
      
      setMessage('');
      
      // Check for auto replies
      const { data: autoReplies, error: autoRepliesError } = await supabase
        .from('auto_replies')
        .select('*')
        .eq('user_id', userId);
      
      if (autoRepliesError) throw autoRepliesError;
      
      // Check for advanced replies
      const { data: advancedReplies, error: advancedRepliesError } = await supabase
        .from('advanced_replies')
        .select('*')
        .eq('user_id', userId);
      
      if (advancedRepliesError) throw advancedRepliesError;
      
      // Check for AI settings
      const { data: aiSettings, error: aiSettingsError } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (aiSettingsError) throw aiSettingsError;
      
      // Simple keyword matching (can be improved)
      let matched = false;
      
      // Check auto replies
      if (autoReplies && autoReplies.length > 0) {
        for (const reply of autoReplies) {
          for (const keyword of reply.keywords) {
            if (message.toLowerCase().includes(keyword.toLowerCase())) {
              await sendMessage({
                sender_type: 'auto_reply',
                message: reply.response
              });
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
      }
      
      // Check advanced replies if no auto reply matched
      if (!matched && advancedReplies && advancedReplies.length > 0) {
        for (const reply of advancedReplies) {
          for (const keyword of reply.keywords) {
            if (message.toLowerCase().includes(keyword.toLowerCase())) {
              await sendMessage({
                sender_type: 'advanced_reply',
                message: reply.response
              });
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
      }
      
      // Use AI if enabled and no other reply matched
      if (!matched && aiSettings && aiSettings.is_enabled && aiSettings.api_key) {
        // In a real implementation, this would call the OpenAI API
        // For now, just send a placeholder message
        await sendMessage({
          sender_type: 'ai',
          message: "I'm processing your request with AI. This is a placeholder for the actual AI response."
        });
      } else if (!matched) {
        // Default response if nothing matched
        await sendMessage({
          sender_type: 'user',
          message: "Thanks for your message! We'll get back to you soon."
        });
      }
    } catch (error: any) {
      console.error('Error in message handling:', error);
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Position styling
  const getPositionStyle = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'top-left':
        return { top: '20px', left: '20px' };
      case 'bottom-right':
      default:
        return { bottom: '20px', right: '20px' };
    }
  };

  if (loading) {
    return null; // Don't render anything until settings are loaded
  }

  return (
    <div className="widget-container" style={getPositionStyle()}>
      {isOpen && (
        <div className="chat-window">
          <div 
            className="chat-header flex justify-between items-center"
            style={{ backgroundColor: settings.primary_color, color: settings.secondary_color }}
          >
            <span>{settings.business_name}</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="chat-messages bg-gray-50">
            {messages.map((msg, index) => (
              <div 
                key={msg.id || index}
                className={`message ${
                  msg.sender_type === 'visitor' 
                    ? 'user-message' 
                    : 'bot-message'
                }`}
              >
                <div>{msg.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatTime(msg.created_at)}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center text-gray-500 text-sm mt-2">
                <Loader size={14} className="animate-spin mr-2" />
                <span>Typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-2 text-xs">
              Error: {error}
            </div>
          )}
          
          <div className="chat-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              disabled={sending}
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
              style={{ backgroundColor: settings.primary_color, color: settings.secondary_color }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      
      <div 
        className="chat-button"
        style={{ backgroundColor: settings.primary_color, color: settings.secondary_color }}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare size={24} />
      </div>
    </div>
  );
};

export default ChatWidget;