import { useState, useEffect, useContext } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Settings, 
  MessageSquare, 
  Bot, 
  Zap, 
  Users, 
  LogOut,
  Menu,
  X,
  Code
} from 'lucide-react';
import { AppContext } from '../App';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [colorScheme, setColorScheme] = useState('#4f46e5');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWidgetSettings();
    }
    
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [user]);

  const fetchWidgetSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching widget settings:', error);
        return;
      }
      
      if (data) {
        setColorScheme(data.primary_color);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const tabs = [
    { path: 'widget-settings', label: 'Widget Settings', icon: <Settings size={18} /> },
    { path: 'auto-reply', label: 'Auto Reply', icon: <MessageSquare size={18} /> },
    { path: 'advanced-reply', label: 'Advanced Reply', icon: <Zap size={18} /> },
    { path: 'ai-mode', label: 'AI Mode', icon: <Bot size={18} /> },
    { path: 'live-chat', label: 'Live Chat', icon: <Users size={18} /> },
  ];

  const currentTab = location.pathname.split('/').pop() || '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Business Chat Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <LogOut size={18} className="mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`bg-white shadow-md z-20 ${
            sidebarOpen 
              ? 'fixed inset-y-0 left-0 w-64 transform translate-x-0 md:relative md:translate-x-0 transition-transform duration-300 ease-in-out'
              : 'fixed inset-y-0 left-0 w-64 transform -translate-x-full transition-transform duration-300 ease-in-out'
          }`}
          style={{ marginTop: isMobile ? '64px' : '0' }}
        >
          <div className="h-full flex flex-col">
            <nav className="flex-1 overflow-y-auto py-6">
              <ul className="space-y-2 px-3">
                {tabs.map((tab) => (
                  <li key={tab.path}>
                    <Link
                      to={`/dashboard/${tab.path}`}
                      className={`flex items-center px-4 py-3 rounded-md text-sm font-medium ${
                        currentTab === tab.path
                          ? 'text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      style={{ 
                        backgroundColor: currentTab === tab.path ? colorScheme : 'transparent',
                        color: currentTab === tab.path ? 'white' : 'inherit'
                      }}
                    >
                      <span className="mr-3">{tab.icon}</span>
                      {tab.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                <Code size={14} className="mr-2" />
                <span>v0.1.0</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet context={{ colorScheme }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;