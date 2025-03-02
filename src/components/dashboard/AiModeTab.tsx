import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

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
    return <div>Loading AI settings...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">AI Mode Settings</h2>
      
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
        <div className="flex items-center">
          <input
            id="is_enabled"
            name="is_enabled"
            type="checkbox"
            checked={settings.is_enabled}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_enabled" className="ml-2 block text-sm font-medium text-gray-700">
            Enable AI Mode
          </label>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
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
            <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="context_info" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiModeTab;