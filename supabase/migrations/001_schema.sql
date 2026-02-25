-- PesoShield Database Schema
-- Simple family financial dashboard

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets (one per user per month)
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Budget line items
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  planned NUMERIC(12,2) NOT NULL,
  spent NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current FX rates (upserted on each fetch)
CREATE TABLE rate_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_type TEXT NOT NULL UNIQUE,
  buy_rate NUMERIC(12,2),
  sell_rate NUMERIC(12,2),
  source TEXT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical FX rates (for charts)
CREATE TABLE rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_type TEXT NOT NULL,
  buy_rate NUMERIC(12,2),
  sell_rate NUMERIC(12,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_history_lookup ON rate_history(rate_type, recorded_at DESC);

-- CPI data
CREATE TABLE cpi_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period DATE NOT NULL UNIQUE,
  value NUMERIC(10,4) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_own ON profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY budgets_own ON budgets FOR ALL USING (auth.uid() = user_id);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY items_own ON budget_items FOR ALL
  USING (budget_id IN (SELECT id FROM budgets WHERE user_id = auth.uid()));

ALTER TABLE rate_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY rates_read ON rate_cache FOR SELECT USING (true);

ALTER TABLE rate_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY history_read ON rate_history FOR SELECT USING (true);

ALTER TABLE cpi_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY cpi_read ON cpi_cache FOR SELECT USING (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuario'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
