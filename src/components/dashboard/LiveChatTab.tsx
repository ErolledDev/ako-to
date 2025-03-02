import { useState, useEffect, useRef, useContext } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MessageSquare, User, Clock, RefreshCw, X, Send } from 'lucide-react';
import { AppContext } from '../../App';

type ChatMessage = {
  id: string;
  session_id: string;
  sender_type: 'user' | 'visitor' | 'ai' | 'auto_reply' | 'advanced_reply';
  message: string;
  created_at: string;
};

const LiveChatTab = () => {
  const { chatSessions, refreshData, loading } = useContext(AppContext);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesSubscription = useRef<any>(null);
  const refreshTimer = useRef<any>(null);

  useEffect(() => {
    // Set up refresh timer
    refreshTimer.current = setInterval(() => {
      refreshData('chat');
    }, refreshInterval * 1000);
    
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
      
      if (messagesSubscription.current) {
        messagesSubscription.current.unsubscribe();
      }
    };
  }, [refreshInterval]);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession);
      subscribeToMessages(selectedSession);
      markMessagesAsRead(selectedSession);
    }
  }, [selectedSession]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Select first session if none selected and sessions are available
    if (!selectedSession && chatSessions.length > 0) {
      setSelectedSession(chatSessions[0].id);
    }
  }, [chatSessions, selectedSession]);

  const fetchMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      setError(error.message);
    }
  };

  const markMessagesAsRead = async (sessionId: string) => {
    // In a real implementation, you would update a 'read' status for messages
    // For now, we'll just refresh the sessions to update the unread count
    await refreshData('chat');
  };

  const subscribeToMessages = (sessionId: string) => {
    if (messagesSubscription.current) {
      messagesSubscription.current.unsubscribe();
    }
    
    messagesSubscription.current = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
          
          // If the message is from a visitor, refresh sessions to update unread count
          if (newMessage.sender_type === 'visitor') {
            refreshData('chat');
          }
        }
      )
      .subscribe();
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedSession) return;
    
    try {
      setSending(true);
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: selectedSession,
          sender_type: 'user',
          message: replyText
        });
      
      if (error) throw error;
      
      // Update session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedSession);
      
      setReplyText('');
      // No need to refresh all data, the subscription will handle the new message
    } catch (error: any) {
      console.error('Error sending reply:', error);
      setError(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to close this chat session?')) return;
    
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      // Send closing message
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: 'user',
          message: 'This chat session has been closed.'
        });
      
      // Refresh sessions
      refreshData('chat');
      
      // If this was the selected session, clear selection
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
    } catch (error: any) {
      console.error('Error closing session:', error);
      setError(error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="flex h-[calc(100vh-250px)] min-h-[500px]">
        {/* Sessions list */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-800">Chat Sessions</h3>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <RefreshCw size={14} className="mr-1" />
              <span>Auto-refreshing every {refreshInterval} seconds</span>
            </div>
          </div>
          
          {chatSessions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No active chat sessions.
            </div>
          ) : (
            <div>
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    selectedSession === session.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <User size={18} className="text-gray-400 mr-2" />
                      <span className="font-medium text-gray-800">
                        Visitor {session.visitor_id.substring(0, 8)}...
                      </span>
                    </div>
                    {session.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {session.unread_count}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <Clock size={14} className="mr-1" />
                    {formatDate(session.updated_at)}
                  </div>
                  
                  {session.last_message && (
                    <div className="mt-2 text-sm text-gray-600 truncate">
                      {session.last_message}
                    </div>
                  )}
                  
                  <div className="mt-2 flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      session.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.is_active ? 'Active' : 'Closed'}
                    </span>
                    
                    {session.is_active && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseSession(session.id);
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Chat area */}
        <div className="w-2/3 flex flex-col">
          {selectedSession ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800">
                  Chat with Visitor {chatSessions.find(s => s.id === selectedSession)?.visitor_id.substring(0, 8)}...
                </h3>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto bg-gray-100">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 max-w-[80%] ${
                      message.sender_type === 'visitor' 
                        ? 'ml-0' 
                        : 'ml-auto'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${
                      message.sender_type === 'visitor'
                        ? 'bg-white text-gray-800'
                        : message.sender_type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                    }`}>
                      {message.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.sender_type === 'visitor' ? 'Visitor' : 
                       message.sender_type === 'user' ? 'You' :
                       message.sender_type === 'ai' ? 'AI' :
                       message.sender_type === 'auto_reply' ? 'Auto Reply' :
                       'Advanced Reply'} • {formatDate(message.created_at)}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Type your reply..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending || !chatSessions.find(s => s.id === selectedSession)?.is_active}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim() || !chatSessions.find(s => s.id === selectedSession)?.is_active}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
                {!chatSessions.find(s => s.id === selectedSession)?.is_active && (
                  <div className="mt-2 text-sm text-red-600">
                    This chat session is closed. You cannot send messages.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Select a chat session to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChatTab;