-- 000_create_tours
-- Base tours table (FOUNDATION)


CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


  name TEXT NOT NULL,
  description TEXT,
  duration TEXT,


  -- Pricing
  price_zar NUMERIC(10,2) NOT NULL,
  max_people INTEGER DEFAULT 22,


  active BOOLEAN DEFAULT true,


  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Updated_at trigger function (shared)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

