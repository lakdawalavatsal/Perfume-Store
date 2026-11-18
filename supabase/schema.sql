-- ============================================================================
-- MANGAALAM LUXURY PERFUMES — COMPLETE SUPABASE DEPLOYMENT SCRIPT
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  size TEXT NOT NULL,
  volume_ml INTEGER NOT NULL CHECK (volume_ml > 0),
  price_in_paise BIGINT NOT NULL CHECK (price_in_paise > 0),
  price_in_rupees NUMERIC(10, 2) GENERATED ALWAYS AS (price_in_paise / 100.0) STORED,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  bottle_image TEXT NOT NULL,
  box_image TEXT,
  square_image TEXT,
  category TEXT NOT NULL CHECK (category IN ('50ml', '20ml')),
  type TEXT,
  aura TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ----------------------------------------------------------------------------
-- 2. ORDERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  order_notes TEXT,
  subtotal_in_paise BIGINT NOT NULL CHECK (subtotal_in_paise >= 0),
  shipping_fee_in_paise BIGINT NOT NULL DEFAULT 0 CHECK (shipping_fee_in_paise >= 0),
  total_amount_in_paise BIGINT NOT NULL CHECK (total_amount_in_paise >= 0),
  subtotal_in_rupees NUMERIC(10, 2) GENERATED ALWAYS AS (subtotal_in_paise / 100.0) STORED,
  total_amount_in_rupees NUMERIC(10, 2) GENERATED ALWAYS AS (total_amount_in_paise / 100.0) STORED,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'manual_upi', 'online_gateway')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status TEXT NOT NULL DEFAULT 'New' CHECK (order_status IN ('New', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled')),
  shipping_provider TEXT,
  tracking_number TEXT,
  admin_notes TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ----------------------------------------------------------------------------
-- 3. ORDER ITEMS TABLE (Immutable historic snapshots)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name_snapshot TEXT NOT NULL,
  size_snapshot TEXT NOT NULL,
  unit_price_in_paise BIGINT NOT NULL CHECK (unit_price_in_paise >= 0),
  unit_price_in_rupees NUMERIC(10, 2) GENERATED ALWAYS AS (unit_price_in_paise / 100.0) STORED,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_in_paise BIGINT NOT NULL CHECK (line_total_in_paise >= 0),
  line_total_in_rupees NUMERIC(10, 2) GENERATED ALWAYS AS (line_total_in_paise / 100.0) STORED,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ----------------------------------------------------------------------------
-- 4. ADMIN PROFILES TABLE (Linked with Supabase Auth auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Mrs. Manisha Mehta',
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ----------------------------------------------------------------------------
-- 5. PAYMENT CONFIGURATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ----------------------------------------------------------------------------
-- 6. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_configs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  );
$$;

-- Products Policies
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins have full access to products" ON products;
CREATE POLICY "Admins have full access to products" ON products FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Service role full access on products" ON products;
CREATE POLICY "Service role full access on products" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Orders Policies
DROP POLICY IF EXISTS "Admins have full access to orders" ON orders;
CREATE POLICY "Admins have full access to orders" ON orders FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Service role full access on orders" ON orders;
CREATE POLICY "Service role full access on orders" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Order Items Policies
DROP POLICY IF EXISTS "Admins have full access to order items" ON order_items;
CREATE POLICY "Admins have full access to order items" ON order_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Service role full access on order items" ON order_items;
CREATE POLICY "Service role full access on order items" ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin Profiles Policies
DROP POLICY IF EXISTS "Admins can view their own profile" ON admin_profiles;
CREATE POLICY "Admins can view their own profile" ON admin_profiles FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Service role full access on admin profiles" ON admin_profiles;
CREATE POLICY "Service role full access on admin profiles" ON admin_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Payment Configs Policies
DROP POLICY IF EXISTS "Admins have full access to payment configs" ON payment_configs;
CREATE POLICY "Admins have full access to payment configs" ON payment_configs FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Service role full access on payment configs" ON payment_configs;
CREATE POLICY "Service role full access on payment configs" ON payment_configs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 8. ATOMIC ORDER CREATION & INVENTORY DEDUCTION PROCEDURE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_order_id TEXT,
  p_customer_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_address_line1 TEXT,
  p_address_line2 TEXT,
  p_city TEXT,
  p_state TEXT,
  p_pincode TEXT,
  p_order_notes TEXT,
  p_payment_method TEXT,
  p_items JSONB,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_order orders%ROWTYPE;
  v_subtotal BIGINT := 0;
  v_shipping BIGINT := 0;
  v_total BIGINT := 0;
  v_item JSONB;
  v_product products%ROWTYPE;
  v_item_total BIGINT;
  v_quantity INT;
  v_prod_id TEXT;
  v_result JSONB;
  v_inserted_items JSONB := '[]'::jsonb;
BEGIN
  -- 1. Idempotency Check
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT * INTO v_existing_order FROM orders WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      SELECT jsonb_build_object(
        'id', v_existing_order.id,
        'customer_name', v_existing_order.customer_name,
        'phone', v_existing_order.phone,
        'total_amount_in_paise', v_existing_order.total_amount_in_paise,
        'total_amount_in_rupees', v_existing_order.total_amount_in_rupees,
        'payment_method', v_existing_order.payment_method,
        'payment_status', v_existing_order.payment_status,
        'order_status', v_existing_order.order_status,
        'created_at', v_existing_order.created_at,
        'idempotency_hit', true
      ) INTO v_result;
      RETURN v_result;
    END IF;
  END IF;

  -- 2. Validate Items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items cannot be empty.';
  END IF;

  -- 3. Stock Lock & Calculation (Row-level lock FOR UPDATE prevents race conditions)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := v_item->>'id';
    v_quantity := (v_item->>'quantity')::INT;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for fragrance %', v_prod_id;
    END IF;

    SELECT * INTO v_product FROM products WHERE id = v_prod_id AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Fragrance "%" is currently not available for purchase.', v_prod_id;
    END IF;

    IF v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "% (%)". Available: %, requested: %', 
        v_product.name, v_product.size, v_product.stock, v_quantity;
    END IF;

    v_item_total := v_product.price_in_paise * v_quantity;
    v_subtotal := v_subtotal + v_item_total;
  END LOOP;

  v_total := v_subtotal + v_shipping;

  -- 4. Insert Order
  INSERT INTO orders (
    id, customer_name, phone, email, address_line1, address_line2,
    city, state, pincode, order_notes, subtotal_in_paise, shipping_fee_in_paise,
    total_amount_in_paise, payment_method, payment_status, order_status,
    idempotency_key, created_at, updated_at
  ) VALUES (
    p_order_id, p_customer_name, p_phone, p_email, p_address_line1, p_address_line2,
    p_city, p_state, p_pincode, p_order_notes, v_subtotal, v_shipping,
    v_total, p_payment_method, 'pending', 'New',
    p_idempotency_key, timezone('utc', now()), timezone('utc', now())
  );

  -- 5. Insert Snapshot Items & Atomically Decrement Inventory
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := v_item->>'id';
    v_quantity := (v_item->>'quantity')::INT;

    SELECT * INTO v_product FROM products WHERE id = v_prod_id;
    v_item_total := v_product.price_in_paise * v_quantity;

    -- Decrement stock atomically
    UPDATE products
    SET stock = stock - v_quantity, updated_at = timezone('utc', now())
    WHERE id = v_prod_id;

    -- Insert snapshot item
    INSERT INTO order_items (
      order_id, product_id, product_name_snapshot, size_snapshot,
      unit_price_in_paise, quantity, line_total_in_paise, image_url
    ) VALUES (
      p_order_id, v_prod_id, v_product.name, v_product.size,
      v_product.price_in_paise, v_quantity, v_item_total, v_product.bottle_image
    );

    v_inserted_items := v_inserted_items || jsonb_build_object(
      'product_id', v_prod_id,
      'product_name', v_product.name,
      'product_size', v_product.size,
      'unit_price', v_product.price_in_paise / 100.0,
      'unit_price_in_paise', v_product.price_in_paise,
      'quantity', v_quantity,
      'total_price', v_item_total / 100.0,
      'total_price_in_paise', v_item_total,
      'image_url', v_product.bottle_image
    );
  END LOOP;

  -- 6. Construct Return Object
  SELECT jsonb_build_object(
    'id', p_order_id,
    'customer_name', p_customer_name,
    'phone', p_phone,
    'email', p_email,
    'address_line1', p_address_line1,
    'address_line2', p_address_line2,
    'city', p_city,
    'state', p_state,
    'pincode', p_pincode,
    'order_notes', p_order_notes,
    'subtotal_in_paise', v_subtotal,
    'subtotal_in_rupees', v_subtotal / 100.0,
    'shipping_fee_in_paise', v_shipping,
    'total_amount_in_paise', v_total,
    'total_amount_in_rupees', v_total / 100.0,
    'payment_method', p_payment_method,
    'payment_status', 'pending',
    'order_status', 'New',
    'created_at', timezone('utc', now()),
    'items', v_inserted_items
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. SEED OFFICIAL 11 MANGAALAM PERFUMES (Exact ₹79900 & ₹44900 paise)
-- ----------------------------------------------------------------------------
INSERT INTO products (
  id, name, slug, size, volume_ml, price_in_paise, category, type, aura,
  stock, low_stock_threshold, bottle_image, box_image, square_image, is_active
) VALUES
  ('blue-haven-50', 'BLUE HAVEN', 'blue-haven-50ml', '50 ml', 50, 79900, '50ml', 'Vaporisateur Apparel Fragrance', 'Aquatic · Refreshing · Oceanic', 18, 5, '/assets/products/50ml/blue-haven-bottle.webp', '/assets/products/50ml/blue-haven-box.webp', '/assets/products/50ml/blue-haven-square.webp', true),
  ('opulent-50', 'OPULENT', 'opulent-50ml', '50 ml', 50, 79900, '50ml', 'Vaporisateur Apparel Fragrance', 'Floral · Velvety · Sophisticated', 22, 5, '/assets/products/50ml/opulent-bottle.webp', '/assets/products/50ml/opulent-box.webp', '/assets/products/50ml/opulent-square.webp', true),
  ('elvora-50', 'ELVORA', 'elvora-50ml', '50 ml', 50, 79900, '50ml', 'Vaporisateur Apparel Fragrance', 'Verdant · Botanical · Majestic', 4, 5, '/assets/products/50ml/elvora-box.webp', '/assets/products/50ml/elvora-box.webp', '/assets/products/50ml/elvora-square.webp', true),
  ('forever-50', 'FOREVER', 'forever-50ml', '50 ml', 50, 79900, '50ml', 'Eau De Parfum', 'Rich · Romantic · Timeless', 14, 5, '/assets/products/50ml/forever-bottle.webp', '/assets/products/50ml/forever-box.webp', '/assets/products/50ml/forever-square.webp', true),
  ('horizon-50', 'HORIZON', 'horizon-50ml', '50 ml', 50, 79900, '50ml', 'Vaporisateur Apparel Fragrance', 'Twilight · Smoky Amber · Daring', 16, 5, '/assets/products/50ml/horizon-bottle.webp', '/assets/products/50ml/horizon-box.webp', '/assets/products/50ml/horizon-square.webp', true),
  ('charming-50', 'CHARMING', 'charming-50ml', '50 ml', 50, 79900, '50ml', 'Vaporisateur Apparel Fragrance', 'Radiant · Solar Flora · Magnetic', 20, 5, '/assets/products/50ml/charming-bottle.webp', '/assets/products/50ml/charming-box.webp', '/assets/products/50ml/charming-square.webp', true),
  ('blue-haven-20', 'BLUE HAVEN', 'blue-haven-20ml', '20 ml', 20, 44900, '20ml', 'Vaporisateur Travel Fragrance', 'Aquatic · Portable Spark · Marine', 35, 5, '/assets/products/20ml/blue-haven-20ml.webp', null, '/assets/products/20ml/blue-haven-square.webp', true),
  ('charming-20', 'CHARMING', 'charming-20ml', '20 ml', 20, 44900, '20ml', 'Vaporisateur Travel Fragrance', 'Luminous · Warm Spark · Floral', 28, 5, '/assets/products/20ml/charming-20ml.webp', null, '/assets/products/20ml/charming-square.webp', true),
  ('elvora-20', 'ELVORA', 'elvora-20ml', '20 ml', 20, 44900, '20ml', 'Vaporisateur Travel Fragrance', 'Verdant · Green Canopy · Crisp', 30, 5, '/assets/products/20ml/elvora-20ml.webp', null, '/assets/products/20ml/elvora-square.webp', true),
  ('flora-20', 'FLORA', 'flora-20ml', '20 ml', 20, 44900, '20ml', 'Vaporisateur Travel Fragrance', 'Blossom · Powdery Pearl · Graceful', 25, 5, '/assets/products/20ml/flora-20ml.webp', null, '/assets/products/20ml/flora-square.webp', true),
  ('horizon-20', 'HORIZON', 'horizon-20ml', '20 ml', 20, 44900, '20ml', 'Vaporisateur Travel Fragrance', 'Dusk · Ember · Mountain Twilight', 3, 5, '/assets/products/20ml/horizon-20ml.webp', null, '/assets/products/20ml/horizon-square.webp', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  size = EXCLUDED.size,
  volume_ml = EXCLUDED.volume_ml,
  price_in_paise = EXCLUDED.price_in_paise,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  aura = EXCLUDED.aura,
  bottle_image = EXCLUDED.bottle_image,
  box_image = EXCLUDED.box_image,
  square_image = EXCLUDED.square_image,
  is_active = EXCLUDED.is_active,
  updated_at = timezone('utc', now());

-- Initial Payment Configs
INSERT INTO payment_configs (key, value, description)
VALUES
  ('enable_cod', 'true', 'Enable Cash on Delivery option for orders'),
  ('enable_manual_upi', 'true', 'Enable Manual UPI verification via Boutique Concierge'),
  ('upi_vpa', 'mangaalam@upi', 'Virtual Payment Address for direct UPI transfers'),
  ('upi_merchant_name', 'MANGAALAM Perfumes', 'Merchant Name displayed in UPI apps'),
  ('payment_gateway_provider', 'manual', 'Online gateway provider (manual | razorpay | stripe)')
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 10. HELPER FUNCTION TO ASSIGN OWNER ROLE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assign_admin_owner(target_email TEXT, owner_name TEXT DEFAULT 'Mrs. Manisha Mehta')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(target_email);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User "%" does not exist in auth.users. Please create or invite the user first via Supabase Auth.', target_email;
  END IF;

  INSERT INTO admin_profiles (id, email, name, role)
  VALUES (v_user_id, lower(target_email), owner_name, 'owner')
  ON CONFLICT (id) DO UPDATE SET
    role = 'owner',
    name = EXCLUDED.name,
    updated_at = timezone('utc', now());
END;
$$;
