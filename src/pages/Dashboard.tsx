import { useState, useEffect, useContext } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AppContext } from '../App';
import { supabase } from '../lib/supabaseClient';
import { 
  Settings, 
  MessageSquare, 
  Code, 
  Bot, 
  MessageCircle, 
  LogOut, 
  Menu, 
  X,
  Bell,
  User as UserIcon
} from 'lucide-react';

const Dashboard = () => {
  const { widgetSettings, user, refreshData } = useContext(AppContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  
  const colorScheme = widgetSettings?.primary_color || '#4f46e5';

  useEffect(() => {
    // Refresh data when location changes
    refreshData();
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
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Full Height */}
      <div className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r md:border-gray-200">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Business Chat</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={`/dashboard/${item.path}`}
              className={({ isActive }) => 
                `flex items-center px-3 py-3 text-sm font-medium rounded-md ${
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
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon size={16} className="text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
        <div className="px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Business Chat</h1>
            </div>
            
            <div className="flex items-center">
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
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Business Chat</h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="pt-2 pb-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={`/dashboard/${item.path}`}
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 text-base font-medium ${
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
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
            
            <div className="pt-4 pb-3 border-t border-gray-200 px-4">
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon size={16} className="text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 md:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet context={{ colorScheme }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;