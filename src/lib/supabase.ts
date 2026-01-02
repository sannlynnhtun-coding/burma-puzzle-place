import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  created_at: string;
};

export type GameEvent = {
  id: string;
  creator_id: string;
  event_name: string;
  description: string;
  created_at: string;
};

export type Prize = {
  id: string;
  event_id: string;
  name: string;
  value: number;
  is_blank: boolean;
  sort_order: number;
};

export type GameHistory = {
  id: string;
  event_id: string;
  player_id: string;
  won_prize_name: string;
  won_prize_value: number;
  played_at: string;
};
