-- ============================================================
-- QUICKKY MARKETPLACE — SUPABASE DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES  (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  email         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup (including Google OAuth avatar)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    email = COALESCE(public.profiles.email, EXCLUDED.email),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. ADDRESSES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.addresses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label       TEXT NOT NULL DEFAULT 'Home',
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pincode     TEXT NOT NULL,
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own addresses"  ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. WISHLIST ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id  TEXT NOT NULL,
  added_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own wishlist" ON public.wishlist_items FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. CART ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id  TEXT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size        TEXT NOT NULL,
  color_name  TEXT NOT NULL,
  color_hex   TEXT NOT NULL,
  added_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, product_id, size, color_name)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 5. COUPONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('percentage','flat')),
  value           NUMERIC NOT NULL,
  min_order_value NUMERIC NOT NULL DEFAULT 0,
  max_discount    NUMERIC,
  description     TEXT,
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
-- Everyone can read active coupons; only service_role can write
CREATE POLICY "Anyone can read active coupons" ON public.coupons FOR SELECT USING (is_active = TRUE);

-- Seed coupons
INSERT INTO public.coupons (code, type, value, min_order_value, max_discount, description, valid_until)
VALUES
  ('QUICKKY30', 'percentage', 30, 1999, 500, '30% off on your first order (up to ₹500)', '2026-12-31'),
  ('FASHION500', 'flat', 500, 2999, NULL, 'Flat ₹500 off on orders above ₹2999', '2026-12-31'),
  ('NEWUSER',   'percentage', 20, 999, 300, '20% off for new users (up to ₹300)', '2026-12-31')
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 6. ORDERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  address          JSONB NOT NULL,
  payment_method   TEXT NOT NULL,
  payment_status   TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','completed','failed')),
  status           TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','processing','picked_up','out_for_delivery','delivered','cancelled','returned')),
  subtotal         NUMERIC NOT NULL,
  discount         NUMERIC NOT NULL DEFAULT 0,
  delivery_fee     NUMERIC NOT NULL DEFAULT 0,
  tax              NUMERIC NOT NULL DEFAULT 0,
  total            NUMERIC NOT NULL,
  coupon_code      TEXT,
  estimated_delivery TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own orders"     ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can place orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 7. ORDER ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id  TEXT NOT NULL,
  product_snapshot JSONB NOT NULL,  -- name, brand, image, price at time of order
  quantity    INT NOT NULL,
  size        TEXT NOT NULL,
  color_name  TEXT NOT NULL,
  unit_price  NUMERIC NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view order items" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 8. REVIEWS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_id  TEXT NOT NULL,
  order_id    UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       TEXT,
  body        TEXT,
  helpful     INT DEFAULT 0,
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews"  ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Users can write reviews"  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 9. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('order','offer','system','delivery')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ─────────────────────────────────────────────────────────────
-- 10. SEARCH HISTORY
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.search_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  query       TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own search history" ON public.search_history FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wishlist_user     ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user         ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user       ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product   ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user       ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_search_user       ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user    ON public.addresses(user_id);
