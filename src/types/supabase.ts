export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      widget_settings: {
        Row: {
          id: string
          user_id: string
          business_name: string
          primary_color: string
          secondary_color: string
          welcome_message: string
          sales_representative: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          primary_color?: string
          secondary_color?: string
          welcome_message?: string
          sales_representative?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          primary_color?: string
          secondary_color?: string
          welcome_message?: string
          sales_representative?: string
          created_at?: string
        }
      }
      auto_replies: {
        Row: {
          id: string
          user_id: string
          keywords: string[]
          matching_type: 'word_match' | 'fuzzy_match' | 'regex_match' | 'synonym_match'
          response: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          keywords: string[]
          matching_type: 'word_match' | 'fuzzy_match' | 'regex_match' | 'synonym_match'
          response: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          keywords?: string[]
          matching_type?: 'word_match' | 'fuzzy_match' | 'regex_match' | 'synonym_match'
          response?: string
          created_at?: string
        }
      }
      advanced_replies: {
        Row: {
          id: string
          user_id: string
          keywords: string[]
          matching_type: 'word_match' | 'fuzzy_match' | 'regex_match' | 'synonym_match'
          response: string
          is_url: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          keywords: string[]
          matching_type: 'word_match' | 'fuzzy_match' | 'regex_match' | 'synonym_match'
          response: string
          is_url: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          keywords?: string[]
          matching_type?: 'word_match' | 'fuzzy_match' | 'regex_match' | 'synonym_match'
          response?: string
          is_url?: boolean
          created_at?: string
        }
      }
      ai_settings: {
        Row: {
          id: string
          user_id: string
          is_enabled: boolean
          api_key: string
          model: string
          context_info: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          is_enabled?: boolean
          api_key?: string
          model?: string
          context_info?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          is_enabled?: boolean
          api_key?: string
          model?: string
          context_info?: string
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          visitor_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          visitor_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          visitor_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          sender_type: 'user' | 'visitor' | 'ai' | 'auto_reply' | 'advanced_reply'
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          sender_type: 'user' | 'visitor' | 'ai' | 'auto_reply' | 'advanced_reply'
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          sender_type?: 'user' | 'visitor' | 'ai' | 'auto_reply' | 'advanced_reply'
          message?: string
          created_at?: string
        }
      }
    }
  }
}