import { useState, useEffect, useContext } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AppContext } from '../App';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Business Chat Widget</h1>
              </div>
            </div>
            
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <div className="relative">
                <button 
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                </button>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon size={16} className="text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.email}</span>
                </button>
                
                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
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
            
            <div className="mt-auto p-4 border-t border-gray-200">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon size={16} className="text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </button>
            </div>
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