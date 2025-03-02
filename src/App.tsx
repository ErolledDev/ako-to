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
}>({
  session: null,
  user: null
});

function App() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <AppContext.Provider value={{ session, user }}>
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