-- ============================================================
-- QUICKKY SUPER ADMIN — DATABASE SCHEMA EXTENSION
-- Run this in Supabase SQL Editor AFTER the main schema.sql
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. ADMIN ROLES (RBAC)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin','admin','moderator')),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by  UUID REFERENCES auth.users(id)
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
-- Only authenticated admins can read admin_roles
CREATE POLICY "Admins can read admin_roles" ON public.admin_roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.uid())
  );
-- Only super_admins can insert/update/delete admin_roles
CREATE POLICY "Super admins manage admin_roles" ON public.admin_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin')
  );

-- ─────────────────────────────────────────────────────────────
-- 2. CATEGORIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  icon          TEXT DEFAULT '🛍️',
  gradient      TEXT DEFAULT 'from-purple-500 to-blue-500',
  image_url     TEXT,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  product_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active categories" ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

-- Seed default categories
INSERT INTO public.categories (name, slug, icon, gradient, sort_order) VALUES
  ('Fashion', 'fashion', '👗', 'from-pink-500 to-rose-500', 1),
  ('Footwear', 'footwear', '👟', 'from-blue-500 to-cyan-500', 2),
  ('Accessories', 'accessories', '👜', 'from-amber-500 to-orange-500', 3),
  ('Kids', 'kids', '🧸', 'from-green-500 to-teal-500', 4),
  ('Sportswear', 'sportswear', '⚽', 'from-red-500 to-orange-500', 5),
  ('Ethnic', 'ethnic', '🥻', 'from-purple-500 to-pink-500', 6),
  ('Medical', 'medical', '💊', 'from-teal-500 to-green-500', 7),
  ('Electronics', 'electronics', '📱', 'from-gray-700 to-gray-900', 8)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 3. SHOPS (Seller stores)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shops (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  tagline        TEXT,
  logo_url       TEXT,
  banner_url     TEXT,
  category       TEXT,
  category_id    UUID REFERENCES public.categories(id),
  city           TEXT DEFAULT 'Chhatrapati Sambhaji Nagar, Aurangabad',
  address        TEXT,
  pincode        TEXT DEFAULT '431001',
  phone          TEXT,
  email          TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','rejected')),
  is_verified    BOOLEAN DEFAULT FALSE,
  is_featured    BOOLEAN DEFAULT FALSE,
  rating         NUMERIC DEFAULT 0,
  total_ratings  INT DEFAULT 0,
  total_sales    INT DEFAULT 0,
  delivery_time  INT DEFAULT 30,
  min_order      NUMERIC DEFAULT 0,
  about          TEXT,
  established    TEXT,
  reject_reason  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active shops" ON public.shops FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can view own shops" ON public.shops FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "Sellers can insert shops" ON public.shops FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can update own shops" ON public.shops FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY "Admins full access to shops" ON public.shops FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_shops_seller ON public.shops(seller_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops(status);

-- ─────────────────────────────────────────────────────────────
-- 4. PRODUCTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id         UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  seller_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  brand           TEXT,
  description     TEXT,
  category_slug   TEXT,
  category_id     UUID REFERENCES public.categories(id),
  images          JSONB DEFAULT '[]',
  price           NUMERIC NOT NULL CHECK (price >= 0),
  original_price  NUMERIC,
  discount_pct    INT GENERATED ALWAYS AS (
    CASE WHEN original_price > 0 AND original_price > price
      THEN ROUND(((original_price - price) / original_price * 100)::NUMERIC)
      ELSE 0
    END
  ) STORED,
  sizes           JSONB DEFAULT '[]',
  colors          JSONB DEFAULT '[]',
  tags            JSONB DEFAULT '[]',
  rating          NUMERIC DEFAULT 0,
  review_count    INT DEFAULT 0,
  stock           INT DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected','archived')),
  is_featured     BOOLEAN DEFAULT FALSE,
  is_new_arrival  BOOLEAN DEFAULT FALSE,
  reject_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can view own products" ON public.products FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "Sellers can insert products" ON public.products FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can update own products" ON public.products FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY "Admins full access to products" ON public.products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_products_shop   ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_cat    ON public.products(category_slug);

-- ─────────────────────────────────────────────────────────────
-- 5. BANNERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  image_url   TEXT,
  link_url    TEXT,
  position    TEXT NOT NULL DEFAULT 'hero' CHECK (position IN ('hero','mid','category','footer','popup')),
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  bg_color    TEXT DEFAULT '#7C3AED',
  text_color  TEXT DEFAULT '#FFFFFF',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 6. PLATFORM SETTINGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  type        TEXT DEFAULT 'string' CHECK (type IN ('string','number','boolean','json')),
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_by  UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read platform settings" ON public.platform_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage platform settings" ON public.platform_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

-- Seed default settings
INSERT INTO public.platform_settings (key, value, description, type) VALUES
  ('free_delivery_threshold', '499', 'Minimum order value for free delivery (₹)', 'number'),
  ('delivery_fee', '49', 'Delivery fee for orders below threshold (₹)', 'number'),
  ('platform_commission', '15', 'Platform commission percentage from sellers (%)', 'number'),
  ('max_delivery_time', '30', 'Maximum delivery time in minutes', 'number'),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode', 'boolean'),
  ('platform_name', 'Quickky', 'Platform display name', 'string'),
  ('support_email', 'support@quickky.in', 'Support contact email', 'string'),
  ('support_phone', '+91 1800-QUICKKY', 'Support contact phone', 'string'),
  ('tax_rate', '5', 'GST tax rate percentage (%)', 'number'),
  ('max_coupon_discount', '1000', 'Maximum discount amount per coupon (₹)', 'number')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 7. ADMIN AUDIT LOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email  TEXT,
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  entity_name  TEXT,
  details      JSONB DEFAULT '{}',
  ip_address   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view logs" ON public.admin_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));
CREATE POLICY "Admins can insert logs" ON public.admin_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_time  ON public.admin_logs(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 8. EXTEND EXISTING TABLES
-- ─────────────────────────────────────────────────────────────

-- Add is_blocked and role to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer','seller','admin')),
  ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC DEFAULT 0;

-- Allow admins to read ALL profiles
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- Allow admins to update any profile (for blocking)
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- Allow admins to read ALL orders
DROP POLICY IF EXISTS "Admins read all orders" ON public.orders;
CREATE POLICY "Admins read all orders" ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- Allow admins to update ALL orders (cancel, process refund)
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- Allow admins to write coupons
DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

-- Allow admins to send notifications to anyone
DROP POLICY IF EXISTS "Admins manage notifications" ON public.notifications;
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 9. REALTIME for admin tables
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- ─────────────────────────────────────────────────────────────
-- 10. HELPER FUNCTION: Check if user is admin
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = user_uuid);
$$;

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status     ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created    ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role     ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked  ON public.profiles(is_blocked);

-- ─────────────────────────────────────────────────────────────
-- HOW TO ADD YOUR FIRST SUPER ADMIN:
-- After running this schema, run the following in SQL Editor,
-- replacing 'your-email@example.com' with your admin email:
--
-- INSERT INTO public.admin_roles (user_id, role)
-- SELECT id, 'super_admin'
-- FROM auth.users
-- WHERE email = 'your-email@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
-- ─────────────────────────────────────────────────────────────
