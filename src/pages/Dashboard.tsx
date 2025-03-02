import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Settings, MessageSquare, Bot, Zap, Users, Copy, LogOut } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [widgetCode, setWidgetCode] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        setWidgetCode(`<script src="https://widget-chat-app.netlify.app/chat.js"></script>
<script>
  new BusinessChatPlugin({
    uid: '${user.id}'
  });
</script>`);
      }
    };
    
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Business Chat Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Widget Code Section */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4 text-gray-800">Your Widget Installation Code</h2>
          <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{widgetCode}</pre>
          </div>
          <button
            onClick={copyWidgetCode}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Copy size={18} className="mr-2" />
            {codeCopied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.path}
                  onClick={() => navigate(`/dashboard/${tab.path}`)}
                  className={`flex items-center px-6 py-4 text-sm font-medium ${
                    currentTab === tab.path
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;