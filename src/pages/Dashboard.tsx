import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Settings, 
  MessageSquare, 
  Code, 
  Bot, 
  MessageCircle, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

const Dashboard = () => {
  const [colorScheme, setColorScheme] = useState('#4f46e5');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const fetchColorScheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const { data } = await supabase
          .from('widget_settings')
          .select('primary_color')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data && data.primary_color) {
          setColorScheme(data.primary_color);
        }
      } catch (error) {
        console.error('Error fetching color scheme:', error);
      }
    };
    
    fetchColorScheme();
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { path: 'widget-settings', label: 'Widget Settings', icon: <Settings size={18} /> },
    { path: 'auto-reply', label: 'Auto Reply', icon: <MessageSquare size={18} /> },
    { path: 'advanced-reply', label: 'Advanced Reply', icon: <Code size={18} /> },
    { path: 'ai-mode', label: 'AI Mode', icon: <Bot size={18} /> },
    { path: 'live-chat', label: 'Live Chat', icon: <MessageCircle size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Business Chat Widget</h1>
              </div>
            </div>
            
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition"
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </button>
            </div>
            
            <div className="-mr-2 flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={`/dashboard/${item.path}`}
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 text-base font-medium ${
                    isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <button
                onClick={handleSignOut}
                className="flex items-center text-base font-medium text-gray-500 hover:text-gray-700"
              >
                <LogOut size={18} className="mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="hidden md:block w-64 bg-white shadow-sm rounded-lg overflow-hidden">
            <nav className="mt-5 px-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={`/dashboard/${item.path}`}
                  className={({ isActive }) => 
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                  style={({ isActive }) => 
                    isActive 
                      ? { backgroundColor: colorScheme } 
                      : {}
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          
          {/* Main content */}
          <div className="flex-1 md:ml-6 mt-6 md:mt-0">
            <Outlet context={{ colorScheme }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;