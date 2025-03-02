/*
  # Initial schema for Business Chat Widget

  1. New Tables
    - `widget_settings` - Stores widget configuration
    - `auto_replies` - Stores auto reply configurations
    - `advanced_replies` - Stores advanced reply configurations
    - `ai_settings` - Stores AI mode settings
    - `chat_sessions` - Stores chat sessions between users and visitors
    - `chat_messages` - Stores messages within chat sessions
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create widget_settings table
CREATE TABLE IF NOT EXISTS widget_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  business_name text NOT NULL,
  sales_representative text,
  welcome_message text DEFAULT 'Hello! How can I help you today?',
  primary_color text DEFAULT '#4f46e5',
  secondary_color text DEFAULT '#ffffff',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own widget settings"
  ON widget_settings
  USING (auth.uid() = user_id);

-- Create auto_replies table
CREATE TABLE IF NOT EXISTS auto_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  keywords text[] NOT NULL,
  matching_type text NOT NULL CHECK (matching_type IN ('word_match', 'fuzzy_match', 'regex_match', 'synonym_match')),
  response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auto_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own auto replies"
  ON auto_replies
  USING (auth.uid() = user_id);

-- Create advanced_replies table
CREATE TABLE IF NOT EXISTS advanced_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  keywords text[] NOT NULL,
  matching_type text NOT NULL CHECK (matching_type IN ('word_match', 'fuzzy_match', 'regex_match', 'synonym_match')),
  response text NOT NULL,
  is_url boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE advanced_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own advanced replies"
  ON advanced_replies
  USING (auth.uid() = user_id);

-- Create ai_settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  is_enabled boolean DEFAULT false,
  api_key text,
  model text DEFAULT 'gpt-3.5-turbo',
  context_info text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI settings"
  ON ai_settings
  USING (auth.uid() = user_id);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  visitor_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat sessions"
  ON chat_sessions
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create a chat session"
  ON chat_sessions
  FOR INSERT
  WITH CHECK (true);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'visitor', 'ai', 'auto_reply', 'advanced_reply')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own chat messages"
  ON chat_messages
  USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create a chat message"
  ON chat_messages
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_widget_settings_user_id ON widget_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_replies_user_id ON auto_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_advanced_replies_user_id ON advanced_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_settings_user_id ON ai_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor_id ON chat_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);