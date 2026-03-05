/**
 * TRASHit Database Schema
 * 
 * Execute this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
 * Order matters: enums → tables → indexes → RLS → seed data
 */

-- ─── 1. Custom ENUM Types ────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE provider_status AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE request_status AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'cancelled');

-- ─── 2. Profiles Table ───────────────────────────────────────────────────────
-- Extends auth.users with application-specific data

CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role              user_role        NOT NULL DEFAULT 'customer',
  full_name         TEXT             NOT NULL,
  phone             TEXT,
  provider_status   provider_status,
  id_document_url   TEXT,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 3. Regions Table ───────────────────────────────────────────────────────
-- Sofia districts/regions

CREATE TABLE regions (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- ─── 4. Requests Table ──────────────────────────────────────────────────────
-- Trash removal service requests

CREATE TABLE requests (
  id                         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id                UUID           REFERENCES profiles(id) ON DELETE SET NULL,
  region_id                  INTEGER        NOT NULL REFERENCES regions(id),
  description                TEXT           NOT NULL,
  address                    TEXT           NOT NULL,
  preferred_time             TEXT,
  price_offer                NUMERIC(10, 2),
  stripe_payment_intent_id   TEXT,
  status                     request_status NOT NULL DEFAULT 'open',
  created_at                 TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_customer  ON requests(customer_id);
CREATE INDEX idx_requests_provider  ON requests(provider_id);
CREATE INDEX idx_requests_region    ON requests(region_id);
CREATE INDEX idx_requests_status    ON requests(status);

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 5. Messages Table ──────────────────────────────────────────────────────
-- Chat messages between customer and provider

CREATE TABLE messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID        NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  sender_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_request ON messages(request_id);
CREATE INDEX idx_messages_sender  ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ─── 6. Provider Regions Table ──────────────────────────────────────────────
-- Many-to-many: which regions each provider serves

CREATE TABLE provider_regions (
  provider_id UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  region_id   INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, region_id)
);

CREATE INDEX idx_provider_regions_provider ON provider_regions(provider_id);
CREATE INDEX idx_provider_regions_region   ON provider_regions(region_id);

-- ─── 7. Row Level Security (RLS) ────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_regions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update only their own
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Regions: public read
CREATE POLICY "regions_select_all" ON regions FOR SELECT USING (true);

-- Requests: customers CRUD own, providers see open + assigned, both can update status
CREATE POLICY "requests_select_customer_own" ON requests FOR SELECT
  USING (
    auth.uid() = customer_id
    OR auth.uid() = provider_id
    OR status = 'open'
  );

CREATE POLICY "requests_insert_customer" ON requests FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "requests_update_own" ON requests FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = provider_id);

CREATE POLICY "requests_delete_customer" ON requests FOR DELETE
  USING (auth.uid() = customer_id);

-- Messages: only request participants can read/write
CREATE POLICY "messages_select_own" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_id
      AND (r.customer_id = auth.uid() OR r.provider_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert_own" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_id
      AND (r.customer_id = auth.uid() OR r.provider_id = auth.uid())
    )
  );

-- Provider Regions: providers manage own, all can read
CREATE POLICY "provider_regions_select_all" ON provider_regions FOR SELECT USING (true);
CREATE POLICY "provider_regions_insert_own" ON provider_regions FOR INSERT
  WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "provider_regions_delete_own" ON provider_regions FOR DELETE
  USING (auth.uid() = provider_id);

-- ─── 8. Seed Data: Sofia Regions ────────────────────────────────────────────

INSERT INTO regions (name) VALUES
  ('Lozenets'),
  ('Mladost'),
  ('Studentski grad'),
  ('Lyulin'),
  ('Nadezhda'),
  ('Serdika'),
  ('Oborishte'),
  ('Vitosha');
