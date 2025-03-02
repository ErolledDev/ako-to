import { useState, useEffect, useContext } from 'react';
import { ChromePicker } from 'react-color';
import { supabase } from '../../lib/supabaseClient';
import { Save, X, Palette, Building, User, MessageSquare, Copy } from 'lucide-react';
import { AppContext } from '../../App';

const WidgetSettingsTab = () => {
  const { user, widgetSettings, refreshData, loading } = useContext(AppContext);
  const colorScheme = widgetSettings?.primary_color || '#4f46e5';
  
  const [settings, setSettings] = useState({
    business_name: '',
    sales_representative: '',
    welcome_message: 'Hello! How can I help you today?',
    primary_color: colorScheme,
  });
  
  const [showPrimaryColorPicker, setShowPrimaryColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [widgetCode, setWidgetCode] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (widgetSettings) {
      setSettings({
        business_name: widgetSettings.business_name || '',
        sales_representative: widgetSettings.sales_representative || '',
        welcome_message: widgetSettings.welcome_message || 'Hello! How can I help you today?',
        primary_color: widgetSettings.primary_color || colorScheme,
      });
    }
    
    if (user) {
      setWidgetCode(`<script src="https://widget-chat-app.netlify.app/chat.js"></script>
<script>
  new BusinessChatPlugin({
    uid: '${user.id}'
  });
</script>`);
    }
  }, [widgetSettings, user, colorScheme]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Use .maybeSingle() instead of .single() to avoid PGRST116 error
      const { data, error } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('widget_settings')
          .update({
            business_name: settings.business_name,
            sales_representative: settings.sales_representative,
            welcome_message: settings.welcome_message,
            primary_color: settings.primary_color,
            secondary_color: '#ffffff'
          })
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('widget_settings')
          .insert({
            user_id: user.id,
            business_name: settings.business_name,
            sales_representative: settings.sales_representative,
            welcome_message: settings.welcome_message,
            primary_color: settings.primary_color,
            secondary_color: '#ffffff'
          });
        
        if (insertError) throw insertError;
      }
      
      await refreshData();
      setSuccess('Widget settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Widget Settings</h2>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <X size={20} className="text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Save size={20} className="text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <label htmlFor="business_name" className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <Building size={16} className="mr-2" />
            Business Name
          </label>
          <input
            type="text"
            id="business_name"
            name="business_name"
            value={settings.business_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your Business Name"
          />
        </div>
        
        <div>
          <label htmlFor="sales_representative" className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <User size={16} className="mr-2" />
            Sales Representative Name
          </label>
          <input
            type="text"
            id="sales_representative"
            name="sales_representative"
            value={settings.sales_representative}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Name of your sales representative"
          />
        </div>
        
        <div>
          <label htmlFor="welcome_message" className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <MessageSquare size={16} className="mr-2" />
            Welcome Message
          </label>
          <textarea
            id="welcome_message"
            name="welcome_message"
            value={settings.welcome_message}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Hello! How can I help you today?"
          />
        </div>
        
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <Palette size={16} className="mr-2" />
            Primary Color
          </label>
          <div className="flex items-center">
            <div
              className="w-10 h-10 rounded-md cursor-pointer border border-gray-300 shadow-sm"
              style={{ backgroundColor: settings.primary_color }}
              onClick={() => setShowPrimaryColorPicker(!showPrimaryColorPicker)}
            />
            <input
              type="text"
              value={settings.primary_color}
              onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
              className="ml-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {showPrimaryColorPicker && (
            <div className="absolute z-10 mt-2">
              <div
                className="fixed inset-0"
                onClick={() => setShowPrimaryColorPicker(false)}
              />
              <ChromePicker
                color={settings.primary_color}
                onChange={(color) => setSettings(prev => ({ ...prev, primary_color: color.hex }))}
                disableAlpha
              />
            </div>
          )}
        </div>
        
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: colorScheme }}
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-800">Widget Installation</h3>
          <button
            onClick={copyWidgetCode}
            className="flex items-center px-3 py-1 text-white rounded-md hover:opacity-90 transition-colors"
            style={{ backgroundColor: colorScheme }}
          >
            <Copy size={16} className="mr-2" />
            {codeCopied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Copy and paste this code just before the closing <code>&lt;/body&gt;</code> tag on your website:
        </p>
        <div className="bg-gray-800 text-gray-200 p-3 rounded-md overflow-x-auto">
          <pre className="text-sm">{widgetCode}</pre>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettingsTab;