-- ============================================================================
-- MANGAALAM LUXURY PERFUMES — Database Schema Migration
-- Migration: 20261117000001_create_schema.sql
-- Description: Core tables, RLS policies, atomic order procedure, and indexes
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

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_configs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an authorized admin
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

-- Products Policies:
-- Public can browse active fragrances
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Authenticated Admins have full access to manage catalog and inventory
CREATE POLICY "Admins have full access to products"
  ON products FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service role has full unrestricted access
CREATE POLICY "Service role full access on products"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Orders Policies:
-- Only Authenticated Admins can read/manage all orders
CREATE POLICY "Admins have full access to orders"
  ON orders FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service role full access on orders"
  ON orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Order Items Policies:
CREATE POLICY "Admins have full access to order items"
  ON order_items FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service role full access on order items"
  ON order_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin Profiles Policies:
CREATE POLICY "Admins can view their own profile"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Service role full access on admin profiles"
  ON admin_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Payment Configs Policies:
CREATE POLICY "Admins have full access to payment configs"
  ON payment_configs FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service role full access on payment configs"
  ON payment_configs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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
  v_shipping BIGINT := 0; -- Complimentary luxury courier across India
  v_total BIGINT := 0;
  v_item JSONB;
  v_product products%ROWTYPE;
  v_item_total BIGINT;
  v_quantity INT;
  v_prod_id TEXT;
  v_result JSONB;
  v_inserted_items JSONB := '[]'::jsonb;
BEGIN
  -- 1. Idempotency Check: prevent duplicate orders
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

  -- 3. Stock Lock & Calculation (FOR UPDATE row-level locks prevent race conditions)
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
