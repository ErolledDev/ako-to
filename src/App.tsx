import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import WidgetSettingsTab from './components/dashboard/WidgetSettingsTab';
import AutoReplyTab from './components/dashboard/AutoReplyTab';
import AdvancedReplyTab from './components/dashboard/AdvancedReplyTab';
import AiModeTab from './components/dashboard/AiModeTab';
import LiveChatTab from './components/dashboard/LiveChatTab';

// Create context for global state
export const AppContext = createContext<{
  session: any;
  user: any;
  widgetSettings: any;
  autoReplies: any[];
  advancedReplies: any[];
  aiSettings: any;
  chatSessions: any[];
  refreshData: (dataType?: 'all' | 'widget' | 'auto' | 'advanced' | 'ai' | 'chat') => Promise<void>;
  loading: boolean;
  updateWidgetSettings: (settings: any) => Promise<void>;
  addAutoReply: (reply: any) => Promise<void>;
  updateAutoReply: (id: string, reply: any) => Promise<void>;
  deleteAutoReply: (id: string) => Promise<void>;
  addAdvancedReply: (reply: any) => Promise<void>;
  updateAdvancedReply: (id: string, reply: any) => Promise<void>;
  deleteAdvancedReply: (id: string) => Promise<void>;
  updateAiSettings: (settings: any) => Promise<void>;
}>({
  session: null,
  user: null,
  widgetSettings: null,
  autoReplies: [],
  advancedReplies: [],
  aiSettings: null,
  chatSessions: [],
  refreshData: async () => {},
  loading: true,
  updateWidgetSettings: async () => {},
  addAutoReply: async () => {},
  updateAutoReply: async () => {},
  deleteAutoReply: async () => {},
  addAdvancedReply: async () => {},
  updateAdvancedReply: async () => {},
  deleteAdvancedReply: async () => {},
  updateAiSettings: async () => {}
});

function App() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [widgetSettings, setWidgetSettings] = useState<any>(null);
  const [autoReplies, setAutoReplies] = useState<any[]>([]);
  const [advancedReplies, setAdvancedReplies] = useState<any[]>([]);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);

  useEffect(() => {
    // Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        refreshData();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          refreshData();
        } else {
          setLoading(false);
        }
      }
    );

    // Set up real-time subscriptions
    const widgetSettingsSubscription = supabase
      .channel('widget_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'widget_settings' }, 
        payload => {
          if (payload.new && user && payload.new.user_id === user.id) {
            setWidgetSettings(payload.new);
          }
        }
      )
      .subscribe();

    const autoRepliesSubscription = supabase
      .channel('auto_replies_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'auto_replies' }, 
        () => {
          if (user) fetchAutoReplies(user.id);
        }
      )
      .subscribe();

    const advancedRepliesSubscription = supabase
      .channel('advanced_replies_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'advanced_replies' }, 
        () => {
          if (user) fetchAdvancedReplies(user.id);
        }
      )
      .subscribe();

    const aiSettingsSubscription = supabase
      .channel('ai_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_settings' }, 
        payload => {
          if (payload.new && user && payload.new.user_id === user.id) {
            setAiSettings(payload.new);
          }
        }
      )
      .subscribe();

    const chatSessionsSubscription = supabase
      .channel('chat_sessions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_sessions' }, 
        () => {
          if (user) fetchChatSessions(user.id);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      widgetSettingsSubscription.unsubscribe();
      autoRepliesSubscription.unsubscribe();
      advancedRepliesSubscription.unsubscribe();
      aiSettingsSubscription.unsubscribe();
      chatSessionsSubscription.unsubscribe();
    };
  }, [user?.id]);

  const fetchWidgetSettings = useCallback(async (userId: string) => {
    try {
      const { data: settingsData } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      setWidgetSettings(settingsData || {
        business_name: '',
        sales_representative: '',
        welcome_message: 'Hello! How can I help you today?',
        primary_color: '#4f46e5',
        secondary_color: '#ffffff'
      });
      
      return settingsData;
    } catch (error) {
      console.error('Error fetching widget settings:', error);
      return null;
    }
  }, []);

  const fetchAutoReplies = useCallback(async (userId: string) => {
    try {
      const { data: autoRepliesData } = await supabase
        .from('auto_replies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      setAutoReplies(autoRepliesData || []);
      return autoRepliesData;
    } catch (error) {
      console.error('Error fetching auto replies:', error);
      return [];
    }
  }, []);

  const fetchAdvancedReplies = useCallback(async (userId: string) => {
    try {
      const { data: advancedRepliesData } = await supabase
        .from('advanced_replies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      setAdvancedReplies(advancedRepliesData || []);
      return advancedRepliesData;
    } catch (error) {
      console.error('Error fetching advanced replies:', error);
      return [];
    }
  }, []);

  const fetchAiSettings = useCallback(async (userId: string) => {
    try {
      const { data: aiSettingsData } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      setAiSettings(aiSettingsData || {
        is_enabled: false,
        api_key: '',
        model: 'gpt-3.5-turbo',
        context_info: ''
      });
      
      return aiSettingsData;
    } catch (error) {
      console.error('Error fetching AI settings:', error);
      return null;
    }
  }, []);

  const fetchChatSessions = useCallback(async (userId: string) => {
    try {
      const { data: chatSessionsData } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      // Enhance sessions with last message and unread count
      const enhancedSessions = await Promise.all((chatSessionsData || []).map(async (session) => {
        // Get last message
        const { data: lastMessageData } = await supabase
          .from('chat_messages')
          .select('message, created_at, sender_type')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const lastMessage = lastMessageData && lastMessageData.length > 0 
          ? lastMessageData[0].message 
          : '';
        
        // Get unread count (messages from visitor that haven't been read)
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)
          .eq('sender_type', 'visitor');
        
        return {
          ...session,
          last_message: lastMessage,
          unread_count: count || 0
        };
      }));
      
      setChatSessions(enhancedSessions || []);
      return enhancedSessions;
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      return [];
    }
  }, []);

  const refreshData = useCallback(async (dataType: 'all' | 'widget' | 'auto' | 'advanced' | 'ai' | 'chat' = 'all') => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (dataType === 'all' || dataType === 'widget') {
        await fetchWidgetSettings(user.id);
      }
      
      if (dataType === 'all' || dataType === 'auto') {
        await fetchAutoReplies(user.id);
      }
      
      if (dataType === 'all' || dataType === 'advanced') {
        await fetchAdvancedReplies(user.id);
      }
      
      if (dataType === 'all' || dataType === 'ai') {
        await fetchAiSettings(user.id);
      }
      
      if (dataType === 'all' || dataType === 'chat') {
        await fetchChatSessions(user.id);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchWidgetSettings, fetchAutoReplies, fetchAdvancedReplies, fetchAiSettings, fetchChatSessions]);

  // CRUD operations for widget settings
  const updateWidgetSettings = useCallback(async (settings: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        // Update existing settings
        await supabase
          .from('widget_settings')
          .update(settings)
          .eq('user_id', user.id);
      } else {
        // Insert new settings
        await supabase
          .from('widget_settings')
          .insert({
            user_id: user.id,
            ...settings
          });
      }
      
      // Update local state immediately for better UX
      setWidgetSettings(prev => ({...prev, ...settings}));
      return true;
    } catch (error) {
      console.error('Error updating widget settings:', error);
      throw error;
    }
  }, [user]);

  // CRUD operations for auto replies
  const addAutoReply = useCallback(async (reply: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('auto_replies')
        .insert({
          user_id: user.id,
          ...reply
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state immediately
      setAutoReplies(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding auto reply:', error);
      throw error;
    }
  }, [user]);

  const updateAutoReply = useCallback(async (id: string, reply: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('auto_replies')
        .update(reply)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state immediately
      setAutoReplies(prev => prev.map(item => item.id === id ? data : item));
      return data;
    } catch (error) {
      console.error('Error updating auto reply:', error);
      throw error;
    }
  }, [user]);

  const deleteAutoReply = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error } = await supabase
        .from('auto_replies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state immediately
      setAutoReplies(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting auto reply:', error);
      throw error;
    }
  }, [user]);

  // CRUD operations for advanced replies
  const addAdvancedReply = useCallback(async (reply: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('advanced_replies')
        .insert({
          user_id: user.id,
          ...reply
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state immediately
      setAdvancedReplies(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding advanced reply:', error);
      throw error;
    }
  }, [user]);

  const updateAdvancedReply = useCallback(async (id: string, reply: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('advanced_replies')
        .update(reply)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state immediately
      setAdvancedReplies(prev => prev.map(item => item.id === id ? data : item));
      return data;
    } catch (error) {
      console.error('Error updating advanced reply:', error);
      throw error;
    }
  }, [user]);

  const deleteAdvancedReply = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error } = await supabase
        .from('advanced_replies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state immediately
      setAdvancedReplies(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting advanced reply:', error);
      throw error;
    }
  }, [user]);

  // CRUD operations for AI settings
  const updateAiSettings = useCallback(async (settings: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        // Update existing settings
        await supabase
          .from('ai_settings')
          .update(settings)
          .eq('user_id', user.id);
      } else {
        // Insert new settings
        await supabase
          .from('ai_settings')
          .insert({
            user_id: user.id,
            ...settings
          });
      }
      
      // Update local state immediately
      setAiSettings(prev => ({...prev, ...settings}));
      return true;
    } catch (error) {
      console.error('Error updating AI settings:', error);
      throw error;
    }
  }, [user]);

  if (loading && !session) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <AppContext.Provider value={{ 
      session, 
      user, 
      widgetSettings, 
      autoReplies, 
      advancedReplies, 
      aiSettings, 
      chatSessions,
      refreshData,
      loading,
      updateWidgetSettings,
      addAutoReply,
      updateAutoReply,
      deleteAutoReply,
      addAdvancedReply,
      updateAdvancedReply,
      deleteAdvancedReply,
      updateAiSettings
    }}>
      <Routes>
        <Route path="/" element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/" />}>
          <Route index element={<Navigate to="/dashboard/widget-settings" replace />} />
          <Route path="widget-settings" element={<WidgetSettingsTab />} />
          <Route path="auto-reply" element={<AutoReplyTab />} />
          <Route path="advanced-reply" element={<AdvancedReplyTab />} />
          <Route path="ai-mode" element={<AiModeTab />} />
          <Route path="live-chat" element={<LiveChatTab />} />
        </Route>
      </Routes>
    </AppContext.Provider>
  );
}

export default App;