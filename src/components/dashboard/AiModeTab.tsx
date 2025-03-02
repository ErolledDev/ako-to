import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, X, AlertTriangle, Bot, Key, FileText, ToggleLeft, ToggleRight } from 'lucide-react';

const AiModeTab = () => {
  const [settings, setSettings] = useState({
    is_enabled: false,
    api_key: '',
    model: 'gpt-3.5-turbo',
    context_info: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchAiSettings = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        // Use .maybeSingle() instead of .single() to avoid PGRST116 error
        const { data, error } = await supabase
          .from('ai_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setSettings({
            is_enabled: data.is_enabled,
            api_key: data.api_key,
            model: data.model,
            context_info: data.context_info
          });
        }
      } catch (error: any) {
        console.error('Error fetching AI settings:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAiSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Validate API key if AI is enabled
      if (settings.is_enabled && !settings.api_key) {
        throw new Error('API key is required when AI mode is enabled');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Use .maybeSingle() instead of .single() to avoid PGRST116 error
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('ai_settings')
          .update({
            is_enabled: settings.is_enabled,
            api_key: settings.api_key,
            model: settings.model,
            context_info: settings.context_info
          })
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('ai_settings')
          .insert({
            user_id: user.id,
            is_enabled: settings.is_enabled,
            api_key: settings.api_key,
            model: settings.model,
            context_info: settings.context_info
          });
        
        if (insertError) throw insertError;
      }
      
      setSuccess('AI settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving AI settings:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setSettings(prev => ({ ...prev, [name]: newValue }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">AI Mode Settings</h2>
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
        <div className="flex items-center">
          <button
            onClick={() => setSettings(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
            className="flex items-center focus:outline-none"
          >
            {settings.is_enabled ? (
              <ToggleRight size={24} className="text-blue-600" />
            ) : (
              <ToggleLeft size={24} className="text-gray-400" />
            )}
            <span className="ml-2 text-sm font-medium text-gray-700">
              {settings.is_enabled ? 'AI Mode Enabled' : 'AI Mode Disabled'}
            </span>
          </button>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle size={20} className="text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>How AI Mode works:</strong> AI will only respond if no keywords match in Auto Reply or Advanced Reply. 
                When AI Mode is disabled, if no keywords match, the widget will respond with "We'll get back to you soon" or similar message.
              </p>
            </div>
          </div>
        </div>
        
        <div className={settings.is_enabled ? '' : 'opacity-50 pointer-events-none'}>
          <div>
            <label htmlFor="api_key" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <Key size={16} className="mr-2" />
              AI API Key
            </label>
            <input
              type="password"
              id="api_key"
              name="api_key"
              value={settings.api_key}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your OpenAI API key"
              disabled={!settings.is_enabled}
            />
            <p className="mt-1 text-sm text-gray-500">
              Your API key is stored securely and used only for generating responses.
            </p>
          </div>
          
          <div className="mt-4">
            <label htmlFor="model" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <Bot size={16} className="mr-2" />
              AI Model
            </label>
            <select
              id="model"
              name="model"
              value={settings.model}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!settings.is_enabled}
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
          
          <div className="mt-4">
            <label htmlFor="context_info" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <FileText size={16} className="mr-2" />
              Business Context Information
            </label>
            <textarea
              id="context_info"
              name="context_info"
              value={settings.context_info}
              onChange={handleChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter information about your business, products, services, and how you want the AI to respond to customers..."
              disabled={!settings.is_enabled}
            />
            <p className="mt-1 text-sm text-gray-500">
              Provide detailed information about your business, products, services, pricing, and any specific instructions for how the AI should respond to customers. This context will be used to generate relevant and accurate responses.
            </p>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiModeTab;