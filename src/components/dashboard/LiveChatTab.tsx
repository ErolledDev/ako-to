import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

type ChatSession = {
  id: string;
  visitor_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_message?: string;
};

type ChatMessage = {
  id: string;
  session_id: string;
  sender_type: 'user' | 'visitor' | 'ai' | 'auto_reply' | 'advanced_reply';
  message: string;
  created_at: string;
};

const LiveChatTab = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messagesSubscription = useRef<any>(null);
  const sessionsSubscription = useRef<any>(null);

  useEffect(() => {
    fetchSessions();
    
    return () => {
      if (messagesSubscription.current) {
        messagesSubscription.current.unsubscribe();
      }
      if (sessionsSubscription.current) {
        sessionsSubscription.current.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession);
      subscribeToMessages(selectedSession);
    }
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Get last message for each session
      const sessionsWithLastMessage = await Promise.all(
        (data || []).map(async (session) => {
          const { data: messageData } = await supabase
            .from('chat_messages')
            .select('message')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          return {
            ...session,
            last_message: messageData?.message || ''
          };
        })
      );
      
      setSessions(sessionsWithLastMessage);
      
      // Subscribe to session changes
      subscribeToSessions(user.id);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToSessions = (userId: string) => {
    if (sessionsSubscription.current) {
      sessionsSubscription.current.unsubscribe();
    }
    
    sessionsSubscription.current = supabase
      .channel('chat_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();
  };

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
        }
      )
      .subscribe();
  };

  const handleSendMessage = async () => {
    if (!selectedSession || !newMessage.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: selectedSession,
          sender_type: 'user',
          message: newMessage
        });
      
      if (error) throw error;
      
      // Update session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedSession);
      
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message);
    }
  };

  const toggleLiveMode = async () => {
    try {
      if (!selectedSession) return;
      
      const newLiveState = !isLive;
      setIsLive(newLiveState);
      
      // Update session's is_active status
      await supabase
        .from('chat_sessions')
        .update({ is_active: newLiveState })
        .eq('id', selectedSession);
      
      if (newLiveState) {
        // Send system message that agent has joined
        await supabase
          .from('chat_messages')
          .insert({
            session_id: selectedSession,
            sender_type: 'user',
            message: '👋 A support agent has joined the chat.'
          });
      } else {
        // Send system message that agent has left
        await supabase
          .from('chat_messages')
          .insert({
            session_id: selectedSession,
            sender_type: 'user',
            message: '👋 The support agent has left the chat.'
          });
      }
    } catch (error: any) {
      console.error('Error toggling live mode:', error);
      setError(error.message);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getSenderName = (senderType: string) => {
    switch (senderType) {
      case 'user':
        return 'You';
      case 'visitor':
        return 'Visitor';
      case 'ai':
        return 'AI';
      case 'auto_reply':
        return 'Auto Reply';
      case 'advanced_reply':
        return 'Advanced Reply';
      default:
        return senderType;
    }
  };

  if (loading && sessions.length === 0) {
    return <div>Loading chat sessions...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Live Chat</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No chat sessions yet. When visitors start chatting with your widget, their conversations will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* Sessions List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-medium">Chat Sessions</h3>
            </div>
            <div className="overflow-y-auto h-[calc(600px-48px)]">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    setSelectedSession(session.id);
                    setIsLive(session.is_active);
                  }}
                  className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedSession === session.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Visitor {session.visitor_id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-500 truncate">{session.last_message}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(session.updated_at)}</p>
                      {session.is_active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="md:col-span-2 border rounded-lg overflow-hidden flex flex-col">
            {selectedSession ? (
              <>
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                  <h3 className="font-medium">
                    Chat with Visitor {sessions.find(s => s.id === selectedSession)?.visitor_id.substring(0, 8)}
                  </h3>
                  <button
                    onClick={toggleLiveMode}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      isLive
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {isLive ? 'End Live Chat' : 'Go Live'}
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          message.sender_type === 'user'
                            ? 'bg-blue-100 text-blue-900'
                            : message.sender_type === 'visitor'
                            ? 'bg-gray-100 text-gray-900'
                            : message.sender_type === 'ai'
                            ? 'bg-purple-100 text-purple-900'
                            : 'bg-green-100 text-green-900'
                        }`}
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {getSenderName(message.sender_type)} • {formatDate(message.created_at)}
                        </div>
                        <div>{message.message}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="border-t p-3">
                  <div className="flex">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!isLive}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!isLive || !newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                  {!isLive && (
                    <p className="mt-2 text-sm text-gray-500">
                      Click "Go Live" to start chatting with this visitor.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Select a chat session to view messages</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveChatTab;