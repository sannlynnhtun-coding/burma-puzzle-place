/*
  # Puzzle Place - Deal or No Deal Game Platform

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique, required)
      - `created_at` (timestamptz)
    
    - `game_events`
      - `id` (uuid, primary key)
      - `creator_id` (uuid, references profiles)
      - `event_name` (text, required)
      - `description` (text)
      - `created_at` (timestamptz)
    
    - `prize_pool`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references game_events)
      - `name` (text, required) - e.g., "$100" or "Old Shoe"
      - `value` (numeric, required) - 0 for jokes/blanks
      - `is_blank` (boolean, default false)
      - `sort_order` (integer) - to maintain highest to lowest value order
    
    - `game_history`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references game_events)
      - `player_id` (uuid, references profiles)
      - `won_prize_name` (text)
      - `won_prize_value` (numeric)
      - `played_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles, but only update their own
    - Game Events: Anyone can read, only creator can update/delete
    - Prize Pool: Anyone can read, only event creator can modify
    - Game History: Anyone can read, authenticated users can insert their own records

  3. Important Notes
    - Prizes are stored with sort_order to maintain highest to lowest value
    - Value of 0 indicates joke/blank items
    - Leaderboard will filter out zero-value wins
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create game_events table
CREATE TABLE IF NOT EXISTS game_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game events"
  ON game_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON game_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own events"
  ON game_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own events"
  ON game_events FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Create prize_pool table
CREATE TABLE IF NOT EXISTS prize_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES game_events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  is_blank boolean DEFAULT false,
  sort_order integer NOT NULL
);

ALTER TABLE prize_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prize pool"
  ON prize_pool FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event creators can insert prizes"
  ON prize_pool FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_events
      WHERE game_events.id = event_id
      AND game_events.creator_id = auth.uid()
    )
  );

CREATE POLICY "Event creators can update prizes"
  ON prize_pool FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_events
      WHERE game_events.id = event_id
      AND game_events.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_events
      WHERE game_events.id = event_id
      AND game_events.creator_id = auth.uid()
    )
  );

CREATE POLICY "Event creators can delete prizes"
  ON prize_pool FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_events
      WHERE game_events.id = event_id
      AND game_events.creator_id = auth.uid()
    )
  );

-- Create game_history table
CREATE TABLE IF NOT EXISTS game_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES game_events(id) ON DELETE CASCADE NOT NULL,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  won_prize_name text NOT NULL,
  won_prize_value numeric NOT NULL,
  played_at timestamptz DEFAULT now()
);

ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game history"
  ON game_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Players can insert own game history"
  ON game_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prize_pool_event_id ON prize_pool(event_id);
CREATE INDEX IF NOT EXISTS idx_prize_pool_sort_order ON prize_pool(event_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_game_history_value ON game_history(won_prize_value DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_event_id ON game_history(event_id);
CREATE INDEX IF NOT EXISTS idx_game_events_creator_id ON game_events(creator_id);