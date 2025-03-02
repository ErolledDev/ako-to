import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext } from 'react';
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
  refreshData: () => Promise<void>;
  loading: boolean;
}>({
  session: null,
  user: null,
  widgetSettings: null,
  autoReplies: [],
  advancedReplies: [],
  aiSettings: null,
  chatSessions: [],
  refreshData: async () => {},
  loading: true
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

    return () => subscription.unsubscribe();
  }, []);

  const refreshData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch widget settings
      const { data: settingsData } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setWidgetSettings(settingsData || {
        business_name: '',
        sales_representative: '',
        welcome_message: 'Hello! How can I help you today?',
        primary_color: '#4f46e5',
        secondary_color: '#ffffff'
      });
      
      // Fetch auto replies
      const { data: autoRepliesData } = await supabase
        .from('auto_replies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setAutoReplies(autoRepliesData || []);
      
      // Fetch advanced replies
      const { data: advancedRepliesData } = await supabase
        .from('advanced_replies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setAdvancedReplies(advancedRepliesData || []);
      
      // Fetch AI settings
      const { data: aiSettingsData } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setAiSettings(aiSettingsData || {
        is_enabled: false,
        api_key: '',
        model: 'gpt-3.5-turbo',
        context_info: ''
      });
      
      // Fetch chat sessions
      const { data: chatSessionsData } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      loading
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