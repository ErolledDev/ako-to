import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MessageSquare, Send, X, Loader } from 'lucide-react';

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
      if (!matched && aiSettings && aiSettings.is
      )
    }
  }
}