import { useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import { supabase } from '../../lib/supabaseClient';

const WidgetSettingsTab = () => {
  const [settings, setSettings] = useState({
    business_name: '',
    sales_representative: '',
    welcome_message: 'Hello! How can I help you today?',
    primary_color: '#4f46e5',
    secondary_color: '#ffffff'
  });
  
  const [showPrimaryColorPicker, setShowPrimaryColorPicker] = useState(false);
  const [showSecondaryColorPicker, setShowSecondaryColorPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
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
          setSettings({
            business_name: data.business_name,
            sales_representative: data.sales_representative,
            welcome_message: data.welcome_message,
            primary_color: data.primary_color,
            secondary_color: data.secondary_color
          });
        }
      } catch (error: any) {
        console.error('Error fetching settings:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
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
            secondary_color: settings.secondary_color
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
            secondary_color: settings.secondary_color
          });
        
        if (insertError) throw insertError;
      }
      
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

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Widget Settings</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">
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
          <label htmlFor="sales_representative" className="block text-sm font-medium text-gray-700 mb-1">
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
          <label htmlFor="welcome_message" className="block text-sm font-medium text-gray-700 mb-1">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-md cursor-pointer border border-gray-300"
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
                />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Color
            </label>
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-md cursor-pointer border border-gray-300"
                style={{ backgroundColor: settings.secondary_color }}
                onClick={() => setShowSecondaryColorPicker(!showSecondaryColorPicker)}
              />
              <input
                type="text"
                value={settings.secondary_color}
                onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                className="ml-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {showSecondaryColorPicker && (
              <div className="absolute z-10 mt-2">
                <div
                  className="fixed inset-0"
                  onClick={() => setShowSecondaryColorPicker(false)}
                />
                <ChromePicker
                  color={settings.secondary_color}
                  onChange={(color) => setSettings(prev => ({ ...prev, secondary_color: color.hex }))}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettingsTab;