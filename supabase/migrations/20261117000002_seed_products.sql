-- ============================================================================
-- MANGAALAM LUXURY PERFUMES — Catalog Seed Migration
-- Migration: 20261117000002_seed_products.sql
-- Description: Seeds the exact 11 official MANGAALAM perfumes in INR paise
-- ============================================================================

INSERT INTO products (
  id, name, slug, size, volume_ml, price_in_paise, category, type, aura,
  stock, low_stock_threshold, bottle_image, box_image, square_image, is_active
) VALUES
  -- --------------------------------------------------------------------------
  -- 50 ML SIGNATURE COLLECTION (₹799 = 79900 paise each)
  -- --------------------------------------------------------------------------
  (
    'blue-haven-50',
    'BLUE HAVEN',
    'blue-haven-50ml',
    '50 ml',
    50,
    79900,
    '50ml',
    'Vaporisateur Apparel Fragrance',
    'Aquatic · Refreshing · Oceanic',
    18,
    5,
    '/assets/products/50ml/blue-haven-bottle.webp',
    '/assets/products/50ml/blue-haven-box.webp',
    '/assets/products/50ml/blue-haven-square.webp',
    true
  ),
  (
    'opulent-50',
    'OPULENT',
    'opulent-50ml',
    '50 ml',
    50,
    79900,
    '50ml',
    'Vaporisateur Apparel Fragrance',
    'Floral · Velvety · Sophisticated',
    22,
    5,
    '/assets/products/50ml/opulent-bottle.webp',
    '/assets/products/50ml/opulent-box.webp',
    '/assets/products/50ml/opulent-square.webp',
    true
  ),
  (
    'elvora-50',
    'ELVORA',
    'elvora-50ml',
    '50 ml',
    50,
    79900,
    '50ml',
    'Vaporisateur Apparel Fragrance',
    'Verdant · Botanical · Majestic',
    4, -- Intentionally low stock to test low-stock dashboard alert
    5,
    '/assets/products/50ml/elvora-box.webp',
    '/assets/products/50ml/elvora-box.webp',
    '/assets/products/50ml/elvora-square.webp',
    true
  ),
  (
    'forever-50',
    'FOREVER',
    'forever-50ml',
    '50 ml',
    50,
    79900,
    '50ml',
    'Eau De Parfum',
    'Rich · Romantic · Timeless',
    14,
    5,
    '/assets/products/50ml/forever-bottle.webp',
    '/assets/products/50ml/forever-box.webp',
    '/assets/products/50ml/forever-square.webp',
    true
  ),
  (
    'horizon-50',
    'HORIZON',
    'horizon-50ml',
    '50 ml',
    50,
    79900,
    '50ml',
    'Vaporisateur Apparel Fragrance',
    'Twilight · Smoky Amber · Daring',
    16,
    5,
    '/assets/products/50ml/horizon-bottle.webp',
    '/assets/products/50ml/horizon-box.webp',
    '/assets/products/50ml/horizon-square.webp',
    true
  ),
  (
    'charming-50',
    'CHARMING',
    'charming-50ml',
    '50 ml',
    50,
    79900,
    '50ml',
    'Vaporisateur Apparel Fragrance',
    'Radiant · Solar Flora · Magnetic',
    20,
    5,
    '/assets/products/50ml/charming-bottle.webp',
    '/assets/products/50ml/charming-box.webp',
    '/assets/products/50ml/charming-square.webp',
    true
  ),

  -- --------------------------------------------------------------------------
  -- 20 ML TRAVEL COLLECTION (₹449 = 44900 paise each)
  -- --------------------------------------------------------------------------
  (
    'blue-haven-20',
    'BLUE HAVEN',
    'blue-haven-20ml',
    '20 ml',
    20,
    44900,
    '20ml',
    'Vaporisateur Travel Fragrance',
    'Aquatic · Portable Spark · Marine',
    35,
    5,
    '/assets/products/20ml/blue-haven-20ml.webp',
    null,
    '/assets/products/20ml/blue-haven-square.webp',
    true
  ),
  (
    'charming-20',
    'CHARMING',
    'charming-20ml',
    '20 ml',
    20,
    44900,
    '20ml',
    'Vaporisateur Travel Fragrance',
    'Luminous · Warm Spark · Floral',
    28,
    5,
    '/assets/products/20ml/charming-20ml.webp',
    null,
    '/assets/products/20ml/charming-square.webp',
    true
  ),
  (
    'elvora-20',
    'ELVORA',
    'elvora-20ml',
    '20 ml',
    20,
    44900,
    '20ml',
    'Vaporisateur Travel Fragrance',
    'Verdant · Green Canopy · Crisp',
    30,
    5,
    '/assets/products/20ml/elvora-20ml.webp',
    null,
    '/assets/products/20ml/elvora-square.webp',
    true
  ),
  (
    'flora-20',
    'FLORA',
    'flora-20ml',
    '20 ml',
    20,
    44900,
    '20ml',
    'Vaporisateur Travel Fragrance',
    'Blossom · Powdery Pearl · Graceful',
    25,
    5,
    '/assets/products/20ml/flora-20ml.webp',
    null,
    '/assets/products/20ml/flora-square.webp',
    true
  ),
  (
    'horizon-20',
    'HORIZON',
    'horizon-20ml',
    '20 ml',
    20,
    44900,
    '20ml',
    'Vaporisateur Travel Fragrance',
    'Dusk · Ember · Mountain Twilight',
    3, -- Intentionally low stock to test low-stock dashboard alert
    5,
    '/assets/products/20ml/horizon-20ml.webp',
    null,
    '/assets/products/20ml/horizon-square.webp',
    true
  )
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

-- ----------------------------------------------------------------------------
-- INITIAL PAYMENT CONFIGURATIONS
-- ----------------------------------------------------------------------------
INSERT INTO payment_configs (key, value, description)
VALUES
  ('enable_cod', 'true', 'Enable Cash on Delivery option for orders'),
  ('enable_manual_upi', 'true', 'Enable Manual UPI verification via Boutique Concierge'),
  ('upi_vpa', 'mangaalam@upi', 'Virtual Payment Address for direct UPI transfers'),
  ('upi_merchant_name', 'MANGAALAM Perfumes', 'Merchant Name displayed in UPI apps'),
  ('payment_gateway_provider', 'manual', 'Online gateway provider (manual | razorpay | stripe)')
ON CONFLICT (key) DO NOTHING;
