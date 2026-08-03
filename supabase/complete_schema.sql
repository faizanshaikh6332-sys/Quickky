-- ================================================================
-- QUICKKY MARKETPLACE — COMPLETE DATABASE SCHEMA v3.0
-- Execution Order:
--   1. Extensions
--   2. All CREATE TABLE statements
--   3. Functions
--   4. Triggers
--   5. Indexes
--   6. RLS ENABLE + all Policies
--   7. Seed data
--
-- Run in Supabase SQL Editor on a fresh project.
-- Safe to re-run (idempotent).
-- ================================================================

-- ================================================================
-- SECTION 1: EXTENSIONS
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ================================================================
-- SECTION 2: CREATE ALL TABLES (no functions, no policies)
-- ================================================================

-- 2.1 PROFILES  (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  email         TEXT,
  is_blocked    BOOLEAN NOT NULL DEFAULT FALSE,
  role          TEXT    NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer', 'seller', 'admin')),
  total_orders  INT     NOT NULL DEFAULT 0,
  total_spent   NUMERIC NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns if running on a pre-existing database
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role         TEXT    NOT NULL DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_orders INT     NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_spent  NUMERIC NOT NULL DEFAULT 0;


-- 2.2 ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'Home',
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pincode     TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2.3 WISHLIST ITEMS
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);


-- 2.4 CART ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL,
  quantity    INT  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size        TEXT NOT NULL,
  color_name  TEXT NOT NULL,
  color_hex   TEXT NOT NULL DEFAULT '#000000',
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id, size, color_name)
);


-- 2.5 COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT    UNIQUE NOT NULL,
  type            TEXT    NOT NULL CHECK (type IN ('percentage', 'flat')),
  value           NUMERIC NOT NULL CHECK (value > 0),
  min_order_value NUMERIC NOT NULL DEFAULT 0,
  max_discount    NUMERIC,
  description     TEXT,
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  usage_limit     INT,
  usage_count     INT     NOT NULL DEFAULT 0,
  shop_id         UUID,   -- FK to shops added after shops table exists (Section 2.10)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2.6 ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  shop_id            UUID,   -- FK added after shops table (Section 2.10)
  address            JSONB NOT NULL,
  payment_method     TEXT NOT NULL,
  payment_status     TEXT NOT NULL DEFAULT 'pending'
                       CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  status             TEXT NOT NULL DEFAULT 'confirmed'
                       CHECK (status IN (
                         'confirmed', 'processing', 'picked_up',
                         'out_for_delivery', 'delivered', 'cancelled', 'returned'
                       )),
  subtotal           NUMERIC NOT NULL CHECK (subtotal >= 0),
  discount           NUMERIC NOT NULL DEFAULT 0,
  delivery_fee       NUMERIC NOT NULL DEFAULT 0,
  tax                NUMERIC NOT NULL DEFAULT 0,
  total              NUMERIC NOT NULL CHECK (total >= 0),
  coupon_code        TEXT,
  estimated_delivery TIMESTAMPTZ,
  notes              TEXT,
  cancel_reason      TEXT,
  refund_amount      NUMERIC,
  refund_status      TEXT CHECK (refund_status IN ('none', 'pending', 'processed') OR refund_status IS NULL),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2.7 ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id               UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID    NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id       TEXT    NOT NULL,
  product_snapshot JSONB   NOT NULL,
  quantity         INT     NOT NULL CHECK (quantity > 0),
  size             TEXT    NOT NULL,
  color_name       TEXT    NOT NULL,
  unit_price       NUMERIC NOT NULL CHECK (unit_price >= 0)
);


-- 2.8 REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_id  TEXT NOT NULL,
  order_id    UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating      INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       TEXT,
  body        TEXT,
  helpful     INT  NOT NULL DEFAULT 0,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2.9 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('order', 'offer', 'system', 'delivery')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2.10 SEARCH HISTORY
CREATE TABLE IF NOT EXISTS public.search_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query       TEXT NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2.11 ADMIN ROLES  ← created here so all later policies can safely reference it
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'admin'
                CHECK (role IN ('super_admin', 'admin', 'moderator')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES auth.users(id)
);


-- 2.12 CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT    NOT NULL,
  slug          TEXT    UNIQUE NOT NULL,
  icon          TEXT    DEFAULT '🛍️',
  gradient      TEXT    DEFAULT 'from-purple-500 to-blue-500',
  image_url     TEXT,
  sort_order    INT     NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  product_count INT     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2.13 SHOPS (Seller stores)
CREATE TABLE IF NOT EXISTS public.shops (
  id             UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id      UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT    NOT NULL,
  slug           TEXT    UNIQUE NOT NULL,
  tagline        TEXT,
  logo_url       TEXT,
  banner_url     TEXT,
  category       TEXT,
  category_id    UUID    REFERENCES public.categories(id),
  city           TEXT    NOT NULL DEFAULT 'Chhatrapati Sambhaji Nagar, Aurangabad',
  address        TEXT,
  pincode        TEXT    DEFAULT '431001',
  phone          TEXT,
  email          TEXT,
  gstin          TEXT,
  status         TEXT    NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
  rating         NUMERIC NOT NULL DEFAULT 0,
  total_ratings  INT     NOT NULL DEFAULT 0,
  total_sales    INT     NOT NULL DEFAULT 0,
  total_revenue  NUMERIC NOT NULL DEFAULT 0,
  delivery_time  INT     NOT NULL DEFAULT 30,
  min_order      NUMERIC NOT NULL DEFAULT 0,
  about          TEXT,
  established    TEXT,
  reject_reason  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Now that shops exists, add the deferred FK on coupons and orders
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
ALTER TABLE public.orders  ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;


-- 2.14 PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id         UUID    REFERENCES public.shops(id) ON DELETE CASCADE,
  seller_id       UUID    REFERENCES public.profiles(id) ON DELETE SET NULL,
  name            TEXT    NOT NULL,
  slug            TEXT    UNIQUE NOT NULL,
  brand           TEXT,
  description     TEXT,
  category_slug   TEXT,
  category_id     UUID    REFERENCES public.categories(id),
  images          JSONB   NOT NULL DEFAULT '[]',
  price           NUMERIC NOT NULL CHECK (price >= 0),
  original_price  NUMERIC,
  discount_pct    INT GENERATED ALWAYS AS (
    CASE
      WHEN original_price IS NOT NULL
       AND original_price > 0
       AND original_price > price
      THEN ROUND(((original_price - price) / original_price * 100)::NUMERIC)::INT
      ELSE 0
    END
  ) STORED,
  sizes           JSONB   NOT NULL DEFAULT '[]',
  colors          JSONB   NOT NULL DEFAULT '[]',
  tags            JSONB   NOT NULL DEFAULT '[]',
  rating          NUMERIC NOT NULL DEFAULT 0,
  review_count    INT     NOT NULL DEFAULT 0,
  stock           INT     NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'rejected', 'archived')),
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival  BOOLEAN NOT NULL DEFAULT FALSE,
  reject_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2.15 BANNERS
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT    NOT NULL,
  subtitle    TEXT,
  image_url   TEXT,
  link_url    TEXT,
  position    TEXT    NOT NULL DEFAULT 'hero'
                CHECK (position IN ('hero', 'mid', 'category', 'footer', 'popup')),
  sort_order  INT     NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  bg_color    TEXT    NOT NULL DEFAULT '#7C3AED',
  text_color  TEXT    NOT NULL DEFAULT '#FFFFFF',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2.16 PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL DEFAULT 'string'
                CHECK (type IN ('string', 'number', 'boolean', 'json')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id)
);


-- 2.17 ADMIN AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email  TEXT,
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  entity_name  TEXT,
  details      JSONB NOT NULL DEFAULT '{}',
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ================================================================
-- SECTION 3: FUNCTIONS
-- (all tables exist now, so no forward-reference issues)
-- ================================================================

-- 3.1 Generic updated_at setter
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- 3.2 Auto-create profile on new auth user (email + Google OAuth)
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
    full_name  = COALESCE(public.profiles.full_name,  EXCLUDED.full_name),
    email      = COALESCE(public.profiles.email,      EXCLUDED.email),
    updated_at = NOW();
  RETURN NEW;
END;
$$;


-- 3.3 Update shop stats when an order is marked delivered
CREATE OR REPLACE FUNCTION public.update_shop_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' AND NEW.shop_id IS NOT NULL THEN
    UPDATE public.shops
    SET
      total_sales   = total_sales   + 1,
      total_revenue = total_revenue + NEW.total,
      updated_at    = NOW()
    WHERE id = NEW.shop_id;

    IF NEW.user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET
        total_orders = total_orders + 1,
        total_spent  = total_spent  + NEW.total,
        updated_at   = NOW()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


-- 3.4 Helper: check if a given UUID belongs to an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = user_uuid
  );
$$;


-- ================================================================
-- SECTION 4: TRIGGERS
-- ================================================================

DROP TRIGGER IF EXISTS on_auth_user_created   ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at    ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at      ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS shops_updated_at       ON public.shops;
CREATE TRIGGER shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS products_updated_at    ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS categories_updated_at  ON public.categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS banners_updated_at     ON public.banners;
CREATE TRIGGER banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS on_order_delivered     ON public.orders;
CREATE TRIGGER on_order_delivered
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_shop_stats();


-- ================================================================
-- SECTION 5: INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role        ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked     ON public.profiles(is_blocked);

CREATE INDEX IF NOT EXISTS idx_addresses_user       ON public.addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user        ON public.wishlist_items(user_id);

CREATE INDEX IF NOT EXISTS idx_cart_user            ON public.cart_items(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user          ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop          ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created       ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order    ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product      ON public.reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_notifs_user          ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_search_user          ON public.search_history(user_id);

CREATE INDEX IF NOT EXISTS idx_shops_seller         ON public.shops(seller_id);
CREATE INDEX IF NOT EXISTS idx_shops_status         ON public.shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_slug           ON public.shops(slug);

CREATE INDEX IF NOT EXISTS idx_products_shop        ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_seller      ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status      ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_cat         ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_featured    ON public.products(is_featured);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin     ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_time      ON public.admin_logs(created_at DESC);


-- ================================================================
-- SECTION 6: ROW LEVEL SECURITY + POLICIES
-- admin_roles is guaranteed to exist by this point (created in 2.11)
-- ================================================================

-- Helper expression reused in many policies:
--   EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())

-- 6.1 PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );


-- 6.2 ADDRESSES
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_all" ON public.addresses;
CREATE POLICY "addresses_all" ON public.addresses FOR ALL
  USING (auth.uid() = user_id);


-- 6.3 WISHLIST ITEMS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlist_all" ON public.wishlist_items;
CREATE POLICY "wishlist_all" ON public.wishlist_items FOR ALL
  USING (auth.uid() = user_id);


-- 6.4 CART ITEMS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_all" ON public.cart_items;
CREATE POLICY "cart_all" ON public.cart_items FOR ALL
  USING (auth.uid() = user_id);


-- 6.5 COUPONS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_select"    ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_all" ON public.coupons;

CREATE POLICY "coupons_select" ON public.coupons FOR SELECT
  USING (
    is_active = TRUE
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "coupons_admin_all" ON public.coupons FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));


-- 6.6 ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;

CREATE POLICY "orders_select" ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "orders_insert" ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update" ON public.orders FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );


-- 6.7 ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;

CREATE POLICY "order_items_select" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );


-- 6.8 REVIEWS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update" ON public.reviews;

CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);


-- 6.9 NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);


-- 6.10 SEARCH HISTORY
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "search_history_all" ON public.search_history;
CREATE POLICY "search_history_all" ON public.search_history FOR ALL
  USING (auth.uid() = user_id);


-- 6.11 ADMIN ROLES
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_roles_select" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_manage" ON public.admin_roles;

CREATE POLICY "admin_roles_select" ON public.admin_roles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.uid())
  );

CREATE POLICY "admin_roles_manage" ON public.admin_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles ar
      WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin'
    )
  );


-- 6.12 CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_admin"  ON public.categories;

CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (TRUE);

CREATE POLICY "categories_admin" ON public.categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));


-- 6.13 SHOPS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shops_select"         ON public.shops;
DROP POLICY IF EXISTS "shops_seller_insert"  ON public.shops;
DROP POLICY IF EXISTS "shops_seller_update"  ON public.shops;
DROP POLICY IF EXISTS "shops_admin_delete"   ON public.shops;

CREATE POLICY "shops_select" ON public.shops FOR SELECT
  USING (
    status = 'active'
    OR seller_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "shops_seller_insert" ON public.shops FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "shops_seller_update" ON public.shops FOR UPDATE
  USING (
    seller_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "shops_admin_delete" ON public.shops FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));


-- 6.14 PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select"        ON public.products;
DROP POLICY IF EXISTS "products_seller_insert" ON public.products;
DROP POLICY IF EXISTS "products_seller_update" ON public.products;
DROP POLICY IF EXISTS "products_admin_delete"  ON public.products;

CREATE POLICY "products_select" ON public.products FOR SELECT
  USING (
    status = 'active'
    OR seller_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "products_seller_insert" ON public.products FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "products_seller_update" ON public.products FOR UPDATE
  USING (
    seller_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "products_admin_delete" ON public.products FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));


-- 6.15 BANNERS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_select" ON public.banners;
DROP POLICY IF EXISTS "banners_admin"  ON public.banners;

CREATE POLICY "banners_select" ON public.banners FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "banners_admin" ON public.banners FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));


-- 6.16 PLATFORM SETTINGS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON public.platform_settings;
DROP POLICY IF EXISTS "settings_admin"  ON public.platform_settings;

CREATE POLICY "settings_select" ON public.platform_settings FOR SELECT USING (TRUE);

CREATE POLICY "settings_admin" ON public.platform_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));


-- 6.17 ADMIN LOGS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_logs_select" ON public.admin_logs;
DROP POLICY IF EXISTS "admin_logs_insert" ON public.admin_logs;

CREATE POLICY "admin_logs_select" ON public.admin_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));

CREATE POLICY "admin_logs_insert" ON public.admin_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()));


-- ================================================================
-- SECTION 7: REALTIME PUBLICATIONS
-- ================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;


-- ================================================================
-- SECTION 8: SEED DATA
-- ================================================================

-- 8.1 Default categories
INSERT INTO public.categories (name, slug, icon, gradient, sort_order) VALUES
  ('Fashion',     'fashion',     '👗', 'from-pink-500 to-rose-500',    1),
  ('Footwear',    'footwear',    '👟', 'from-blue-500 to-cyan-500',    2),
  ('Accessories', 'accessories', '👜', 'from-amber-500 to-orange-500', 3),
  ('Kids',        'kids',        '🧸', 'from-green-500 to-teal-500',   4),
  ('Sportswear',  'sportswear',  '⚽', 'from-red-500 to-orange-500',   5),
  ('Ethnic',      'ethnic',      '🥻', 'from-purple-500 to-pink-500',  6),
  ('Medical',     'medical',     '💊', 'from-teal-500 to-green-500',   7),
  ('Electronics', 'electronics', '📱', 'from-gray-700 to-gray-900',    8)
ON CONFLICT (slug) DO NOTHING;


-- 8.2 Default platform coupons
INSERT INTO public.coupons (code, type, value, min_order_value, max_discount, description, valid_until) VALUES
  ('QUICKKY30',  'percentage', 30,  1999, 500,  '30% off on your first order (up to ₹500)', '2027-12-31'),
  ('FASHION500', 'flat',       500, 2999, NULL, 'Flat ₹500 off on orders above ₹2999',      '2027-12-31'),
  ('NEWUSER',    'percentage', 20,  999,  300,  '20% off for new users (up to ₹300)',        '2027-12-31'),
  ('SUMMER15',   'percentage', 15,  1499, 400,  '15% off on summer collection',              '2027-09-30')
ON CONFLICT (code) DO NOTHING;


-- 8.3 Default platform settings
INSERT INTO public.platform_settings (key, value, description, type) VALUES
  ('free_delivery_threshold', '499',                                    'Minimum order value for free delivery (₹)',      'number'),
  ('delivery_fee',            '49',                                     'Delivery fee for orders below threshold (₹)',     'number'),
  ('platform_commission',     '15',                                     'Platform commission percentage from sellers (%)', 'number'),
  ('max_delivery_time',       '30',                                     'Maximum delivery time in minutes',                'number'),
  ('maintenance_mode',        'false',                                  'Enable/disable maintenance mode',                 'boolean'),
  ('platform_name',           'Quickky',                                'Platform display name',                           'string'),
  ('support_email',           'support@quickky.in',                     'Support contact email',                           'string'),
  ('support_phone',           '+91 1800-QUICKKY',                       'Support contact phone',                           'string'),
  ('tax_rate',                '5',                                      'GST tax rate percentage (%)',                     'number'),
  ('max_coupon_discount',     '1000',                                   'Maximum discount amount per coupon (₹)',          'number'),
  ('platform_city',           'Chhatrapati Sambhaji Nagar, Aurangabad', 'Primary city of operation',                      'string')
ON CONFLICT (key) DO NOTHING;


-- ================================================================
-- DONE!
--
-- To add your first Super Admin, run this separately after setup:
--
--   INSERT INTO public.admin_roles (user_id, role)
--   SELECT id, 'super_admin'
--   FROM auth.users
--   WHERE email = 'your-admin@email.com'
--   ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
-- ================================================================
