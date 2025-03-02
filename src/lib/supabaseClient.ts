import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://drxjazbhjumeezoifcmq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyeGphemJoanVtZWV6b2lmY21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NDg2NjcsImV4cCI6MjA1NjQyNDY2N30.3O8fxkGWv88Ydo_80hO0S2Qz88T4WKNIosOf1UNeyeA';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);