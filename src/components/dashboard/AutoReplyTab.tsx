import { useState, useContext } from 'react';
import { Plus, Edit, Trash2, Download, Upload, Save, X } from 'lucide-react';
import { AppContext } from '../../App';

type AutoReply = {
  id?: string;
  keywords: string[];
  matching_type: 'word_match' | 'fuzzy_match' | 'regex_match' | 'synonym_match';
  response: string;
};

const AutoReplyTab = () => {
  const { 
    user, 
    autoReplies, 
    addAutoReply, 
    updateAutoReply, 
    deleteAutoReply, 
    widgetSettings, 
    loading 
  } = useContext(AppContext);
  
  const colorScheme = widgetSettings?.primary_color || '#4f46e5';
  
  const [currentReply, setCurrentReply] = useState<AutoReply>({
    keywords: [],
    matching_type: 'word_match',
    response: '',
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Add the keyword if there's text in the input
      if (keywordInput.trim() !== '') {
        setCurrentReply(prev => ({
          ...prev,
          keywords: [...prev.keywords, keywordInput.trim()]
        }));
        setKeywordInput('');
      }
      
      // Validate after potentially adding the keyword
      if (currentReply.keywords.length === 0 && keywordInput.trim() === '') {
        throw new Error('Please add at least one keyword');
      }
      
      if (currentReply.response.trim() === '') {
        throw new Error('Response cannot be empty');
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Prepare the data with the latest keywords
      const replyData = {
        ...currentReply,
        keywords: keywordInput.trim() !== '' 
          ? [...currentReply.keywords, keywordInput.trim()]
          : currentReply.keywords
      };
      
      if (isEditing && currentReply.id) {
        // Update existing auto reply
        await updateAutoReply(currentReply.id, {
          keywords: replyData.keywords,
          matching_type: replyData.matching_type,
          response: replyData.response
        });
      } else {
        // Insert new auto reply
        await addAutoReply({
          keywords: replyData.keywords,
          matching_type: replyData.matching_type,
          response: replyData.response
        });
      }
      
      resetForm();
      setSuccess(isEditing ? 'Auto reply updated successfully!' : 'Auto reply added successfully!');
      setShowForm(false);
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
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this auto reply?')) return;
    
    try {
      setError(null);
      await deleteAutoReply(id);
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
    setKeywordInput('');
    setIsEditing(false);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
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
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Import each reply individually to update state properly
        for (const item of importedData) {
          await addAutoReply({
            keywords: item.keywords,
            matching_type: item.matching_type,
            response: item.response
          });
        }
        
        setSuccess('Auto replies imported successfully!');
      } catch (error: any) {
        console.error('Error importing auto replies:', error);
        setError(error.message);
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Auto Reply Settings</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 text-white rounded-md hover:opacity-90 transition-colors"
            style={{ backgroundColor: colorScheme }}
          >
            <Plus size={18} className="mr-2" />
            Add Auto Reply
          </button>
        </div>
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
      
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
          <h3 className="text-lg font-medium mb-4 text-gray-800">{isEditing ? 'Edit Auto Reply' : 'Add New Auto Reply'}</h3>
          
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
                  placeholder="Enter keyword and press Enter"
                />
                <button
                  onClick={handleAddKeyword}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              {currentReply.keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentReply.keywords.map((keyword: string, index: number) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                      <span>{keyword}</span>
                      <button
                        onClick={() => handleRemoveKeyword(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X size={14} />
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
                className="flex items-center px-4 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: colorScheme }}
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Saving...' : 'Save Reply'}
              </button>
              
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                <X size={18} className="mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">Your Auto Replies</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Download size={16} className="mr-1" />
            Export
          </button>
          
          <label className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer transition-colors">
            <Upload size={16} className="mr-1" />
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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No auto replies yet. Add your first one using the button above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
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
                <tr key={reply.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {reply.keywords.map((keyword: string, index: number) => (
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
                      className="text-blue-600 hover:text-blue-800 mr-4 inline-flex items-center"
                      style={{ color: colorScheme }}
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => reply.id && handleDelete(reply.id)}
                      className="text-red-600 hover:text-red-800 inline-flex items-center"
                    >
                      <Trash2 size={16} className="mr-1" />
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