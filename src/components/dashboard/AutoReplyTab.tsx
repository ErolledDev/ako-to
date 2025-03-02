import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

type AutoReply = {
  id?: string;
  keywords: string[];
  matching_type: 'word_match' | 'fuzzy_match' | 'regex_match' | 'synonym_match';
  response: string;
};

const AutoReplyTab = () => {
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [currentReply, setCurrentReply] = useState<AutoReply>({
    keywords: [],
    matching_type: 'word_match',
    response: '',
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAutoReplies();
  }, []);

  const fetchAutoReplies = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('auto_replies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setAutoReplies(data || []);
    } catch (error: any) {
      console.error('Error fetching auto replies:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() === '') return;
    
    setCurrentReply(prev => ({
      ...prev,
      keywords: [...prev.keywords, keywordInput.trim()]
    }));
    
    setKeywordInput('');
  };

  const handleRemoveKeyword = (index: number) => {
    setCurrentReply(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      if (currentReply.keywords.length === 0) {
        throw new Error('Please add at least one keyword');
      }
      
      if (currentReply.response.trim() === '') {
        throw new Error('Response cannot be empty');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      if (isEditing && currentReply.id) {
        // Update existing auto reply
        const { error } = await supabase
          .from('auto_replies')
          .update({
            keywords: currentReply.keywords,
            matching_type: currentReply.matching_type,
            response: currentReply.response
          })
          .eq('id', currentReply.id);
        
        if (error) throw error;
      } else {
        // Insert new auto reply
        const { error } = await supabase
          .from('auto_replies')
          .insert({
            user_id: user.id,
            keywords: currentReply.keywords,
            matching_type: currentReply.matching_type,
            response: currentReply.response
          });
        
        if (error) throw error;
      }
      
      await fetchAutoReplies();
      resetForm();
      setSuccess(isEditing ? 'Auto reply updated successfully!' : 'Auto reply added successfully!');
    } catch (error: any) {
      console.error('Error saving auto reply:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reply: AutoReply) => {
    setCurrentReply(reply);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this auto reply?')) return;
    
    try {
      setError(null);
      
      const { error } = await supabase
        .from('auto_replies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchAutoReplies();
      setSuccess('Auto reply deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting auto reply:', error);
      setError(error.message);
    }
  };

  const resetForm = () => {
    setCurrentReply({
      keywords: [],
      matching_type: 'word_match',
      response: '',
    });
    setIsEditing(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(autoReplies, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'auto_replies.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as AutoReply[];
        
        if (!Array.isArray(importedData)) {
          throw new Error('Invalid import format');
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Prepare data for import
        const dataToImport = importedData.map(item => ({
          user_id: user.id,
          keywords: item.keywords,
          matching_type: item.matching_type,
          response: item.response
        }));
        
        const { error } = await supabase
          .from('auto_replies')
          .insert(dataToImport);
        
        if (error) throw error;
        
        await fetchAutoReplies();
        setSuccess('Auto replies imported successfully!');
      } catch (error: any) {
        console.error('Error importing auto replies:', error);
        setError(error.message);
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return <div>Loading auto replies...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Auto Reply Settings</h2>
      
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
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-medium mb-4">{isEditing ? 'Edit Auto Reply' : 'Add New Auto Reply'}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords
            </label>
            <div className="flex">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter keyword and press Add or Enter"
              />
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {currentReply.keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {currentReply.keywords.map((keyword, index) => (
                  <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                    <span>{keyword}</span>
                    <button
                      onClick={() => handleRemoveKeyword(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="matching_type" className="block text-sm font-medium text-gray-700 mb-1">
              Matching Type
            </label>
            <select
              id="matching_type"
              value={currentReply.matching_type}
              onChange={(e) => setCurrentReply(prev => ({ ...prev, matching_type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="word_match">Word Match</option>
              <option value="fuzzy_match">Fuzzy Match</option>
              <option value="regex_match">Regular Expression</option>
              <option value="synonym_match">Synonym Match</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
              Response
            </label>
            <textarea
              id="response"
              value={currentReply.response}
              onChange={(e) => setCurrentReply(prev => ({ ...prev, response: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the response message"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Save'}
            </button>
            
            {isEditing && (
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium">Your Auto Replies</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Export
          </button>
          
          <label className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 cursor-pointer">
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      {autoReplies.length === 0 ? (
        <p className="text-gray-500">No auto replies yet. Add your first one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keywords
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matching Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {autoReplies.map((reply) => (
                <tr key={reply.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {reply.keywords.map((keyword, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {reply.matching_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {reply.response}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(reply)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => reply.id && handleDelete(reply.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AutoReplyTab;