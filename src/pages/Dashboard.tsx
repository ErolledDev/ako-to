import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [widgetCode, setWidgetCode] = useState<string>('');

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
    alert('Widget code copied to clipboard!');
  };

  const tabs = [
    { path: 'widget-settings', label: 'Widget Settings' },
    { path: 'auto-reply', label: 'Auto Reply' },
    { path: 'advanced-reply', label: 'Advanced Reply' },
    { path: 'ai-mode', label: 'AI Mode' },
    { path: 'live-chat', label: 'Live Chat' },
  ];

  const currentTab = location.pathname.split('/').pop() || '';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Business Chat Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Widget Code Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Your Widget Installation Code</h2>
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <pre className="whitespace-pre-wrap">{widgetCode}</pre>
          </div>
          <button
            onClick={copyWidgetCode}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Copy Code
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 flex justify-end">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.path}
                  onClick={() => navigate(`/dashboard/${tab.path}`)}
                  className={`px-6 py-4 text-sm font-medium ${
                    currentTab === tab.path
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;