import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/mangaalam.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for concurrency and foreign key enforcement
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // 1. Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      size TEXT NOT NULL,
      volume_ml INTEGER NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      aura TEXT,
      stock INTEGER NOT NULL DEFAULT 25,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      bottle_image TEXT NOT NULL,
      box_image TEXT,
      square_image TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

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
      subtotal INTEGER NOT NULL,
      shipping_fee INTEGER NOT NULL DEFAULT 0,
      total_amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      order_status TEXT NOT NULL DEFAULT 'New',
      shipping_provider TEXT,
      tracking_number TEXT,
      admin_notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      product_size TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'owner',
      token_version INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      password_changed_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_configs (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_pwd_resets_token ON admin_password_resets(token_hash);
  `);

  // Ensure newer columns exist if migrating an existing database
  try {
    const adminCols = db.prepare('PRAGMA table_info(admins)').all().map(c => c.name);
    if (!adminCols.includes('token_version')) {
      db.exec("ALTER TABLE admins ADD COLUMN token_version INTEGER DEFAULT 1");
    }
    if (!adminCols.includes('password_changed_at')) {
      db.exec("ALTER TABLE admins ADD COLUMN password_changed_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }

    const prodCols = db.prepare('PRAGMA table_info(products)').all().map(c => c.name);
    if (!prodCols.includes('price_in_paise')) {
      db.exec("ALTER TABLE products ADD COLUMN price_in_paise INTEGER DEFAULT 0");
      db.exec("UPDATE products SET price_in_paise = price * 100 WHERE price_in_paise = 0");
    }

    const orderCols = db.prepare('PRAGMA table_info(orders)').all().map(c => c.name);
    if (!orderCols.includes('idempotency_key')) {
      db.exec("ALTER TABLE orders ADD COLUMN idempotency_key TEXT");
    }
    if (!orderCols.includes('subtotal_in_paise')) {
      db.exec("ALTER TABLE orders ADD COLUMN subtotal_in_paise INTEGER DEFAULT 0");
      db.exec("ALTER TABLE orders ADD COLUMN shipping_fee_in_paise INTEGER DEFAULT 0");
      db.exec("ALTER TABLE orders ADD COLUMN total_amount_in_paise INTEGER DEFAULT 0");
      db.exec("UPDATE orders SET subtotal_in_paise = subtotal * 100, total_amount_in_paise = total_amount * 100 WHERE total_amount_in_paise = 0");
    }

    const itemCols = db.prepare('PRAGMA table_info(order_items)').all().map(c => c.name);
    if (!itemCols.includes('product_name_snapshot')) {
      db.exec("ALTER TABLE order_items ADD COLUMN product_name_snapshot TEXT");
      db.exec("ALTER TABLE order_items ADD COLUMN size_snapshot TEXT");
      db.exec("ALTER TABLE order_items ADD COLUMN unit_price_in_paise INTEGER DEFAULT 0");
      db.exec("ALTER TABLE order_items ADD COLUMN line_total_in_paise INTEGER DEFAULT 0");
      db.exec("UPDATE order_items SET product_name_snapshot = product_name, size_snapshot = product_size, unit_price_in_paise = unit_price * 100, line_total_in_paise = total_price * 100 WHERE unit_price_in_paise = 0");
    }
  } catch (migErr) {
    console.error('Migration notice:', migErr.message);
  }

  // 2. Seed Initial Products if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (count === 0) {
    console.log('Seeding official MANGAALAM perfume catalog into database...');
    const seedProducts = [
      // 50 ML Collection — ₹799 each
      {
        id: "blue-haven-50",
        name: "BLUE HAVEN",
        slug: "blue-haven-50ml",
        size: "50 ml",
        volume_ml: 50,
        price: 799,
        category: "50ml",
        type: "Vaporisateur Apparel Fragrance",
        aura: "Aquatic · Refreshing · Oceanic",
        stock: 18,
        low_stock_threshold: 5,
        bottle_image: "/assets/products/50ml/blue-haven-bottle.webp",
        box_image: "/assets/products/50ml/blue-haven-box.webp",
        square_image: "/assets/products/50ml/blue-haven-square.webp"
      },
      {
        id: "opulent-50",
        name: "OPULENT",
        slug: "opulent-50ml",
        size: "50 ml",
        volume_ml: 50,
        price: 799,
        category: "50ml",
        type: "Vaporisateur Apparel Fragrance",
        aura: "Floral · Velvety · Sophisticated",
        stock: 22,
        low_stock_threshold: 5,
        bottle_image: "/assets/products/50ml/opulent-bottle.webp",
        box_image: "/assets/products/50ml/opulent-box.webp",
        square_image: "/assets/products/50ml/opulent-square.webp"
      },
      {
        id: "elvora-50",
        name: "ELVORA",
        slug: "elvora-50ml",
        size: "50 ml",
        volume_ml: 50,
        price: 799,
        category: "50ml",
        type: "Vaporisateur Apparel Fragrance",
        aura: "Verdant · Botanical · Majestic",
        stock: 4, // Intentionally low stock to test low-stock dashboard alert
        low_stock_threshold: 5,
        bottle_image: "/assets/products/50ml/elvora-box.webp",
        box_image: "/assets/products/50ml/elvora-box.webp",
        square_image: "/assets/products/50ml/elvora-square.webp"
      },
      {
        id: "forever-50",
        name: "FOREVER",
        slug: "forever-50ml",
        size: "50 ml",
        volume_ml: 50,
        price: 799,
        category: "50ml",
        type: "Eau De Parfum",
        aura: "Rich · Romantic · Timeless",
        stock: 14,
        low_stock_threshold: 5,
        bottle_image: "/assets/products/50ml/forever-bottle.webp",
        box_image: "/assets/products/50ml/forever-box.webp",
        square_image: "/assets/products/50ml/forever-square.webp"
      },
      {
        id: "horizon-50",
        name: "HORIZON",
        slug: "horizon-50ml",
        size: "50 ml",
        volume_ml: 50,
        price: 799,
        category: "50ml",
        type: "Vaporisateur Apparel Fragrance",
        aura: "Twilight · Smoky Amber · Daring",
        stock: 16,
        low_stock_threshold: 5,
        bottle_image: "/assets/products/50ml/horizon-bottle.webp",
        box_image: "/assets/products/50ml/horizon-box.webp",
        square_image: "/assets/products/50ml/horizon-square.webp"
      },
      {
        id: "charming-50",
        name: "CHARMING",
        slug: "charming-50ml",
        size: "50 ml",
        volume_ml: 50,
        price: 799,
        category: "50ml",
        type: "Vaporisateur Apparel Fragrance",
        aura: "Radiant · Solar Flora · Magnetic",
        stock: 20,
        low_stock_threshold: 5,
        bottle_image: "/assets/products/50ml/charming-bottle.webp",
        box_image: "/assets/products/50ml/charming-box.webp",
        square_image: "/assets/products/50ml/charming-square.webp"
      },

      // 20 ML Travel Collection — ₹449 each
      {
        id: "blue-haven-20",
        name: "BLUE HAVEN",
        slug: "blue-haven-20ml",
        size: "20 ml",
        volume_ml: 20,
        price: 449,
        category: "20ml",
        type: "Vaporisateur Travel Fragrance",
        aura: "Aquatic · Portable Spark · Marine",
        stock: 35,
        low_stock_threshold: 5,
        bottle_image: "/assets/products/20ml/blue-haven-20ml.webp",
        box_image: null,
        square_image: "/assets/products/20ml/blue-haven-square.webp"
      },
      {
        id: "charming-20",
        name: "CHARMING",
        slug: "charming-20ml",
        size: "20 ml",
        volume_ml: 20,
        price: 449,
        category: "20ml",
        type: "Vaporisateur Travel Fragrance",
        aura: "Luminous · Warm Spark · Floral",
        stock: 28,
        low_stock_threshold: 5,
        bottle_image: "/assets/products/20ml/charming-20ml.webp",
        box_image: null,
        square_image: "/assets/products/20ml/charming-square.webp"
      },
      {
        id: "elvora-20",
        name: "ELVORA",
        slug: "elvora-20ml",
        size: "20 ml",
        volume_ml: 20,
        price: 449,
        category: "20ml",
        type: "Vaporisateur Travel Fragrance",
        aura: "Verdant · Green Canopy · Crisp",
        stock: 30,
        low_stock_threshold: 5,
        bottle_image: "/assets/products/20ml/elvora-20ml.webp",
        box_image: null,
        square_image: "/assets/products/20ml/elvora-square.webp"
      },
      {
        id: "flora-20",
        name: "FLORA",
        slug: "flora-20ml",
        size: "20 ml",
        volume_ml: 20,
        price: 449,
        category: "20ml",
        type: "Vaporisateur Travel Fragrance",
        aura: "Blossom · Powdery Pearl · Graceful",
        stock: 25,
        low_stock_threshold: 5,
        bottle_image: "/assets/products/20ml/flora-20ml.webp",
        box_image: null,
        square_image: "/assets/products/20ml/flora-square.webp"
      },
      {
        id: "horizon-20",
        name: "HORIZON",
        slug: "horizon-20ml",
        size: "20 ml",
        volume_ml: 20,
        price: 449,
        category: "20ml",
        type: "Vaporisateur Travel Fragrance",
        aura: "Dusk · Ember · Mountain Twilight",
        stock: 3, // Intentionally low stock to test low-stock dashboard alert
        low_stock_threshold: 5,
        bottle_image: "/assets/products/20ml/horizon-20ml.webp",
        box_image: null,
        square_image: "/assets/products/20ml/horizon-square.webp"
      }
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, name, slug, size, volume_ml, price, category, type, aura,
        stock, low_stock_threshold, bottle_image, box_image, square_image
      ) VALUES (
        @id, @name, @slug, @size, @volume_ml, @price, @category, @type, @aura,
        @stock, @low_stock_threshold, @bottle_image, @box_image, @square_image
      )
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) insertProduct.run(item);
    });

    insertMany(seedProducts);
    console.log(`Successfully seeded ${seedProducts.length} official MANGAALAM fragrances.`);
  }

  // 3. Owner Account Security Gate — Never auto-seed default passwords
  // Purge any legacy default seed account that used the publicly known default password
  try {
    const legacyAdmin = db.prepare("SELECT id, email, password_hash FROM admins WHERE email = 'admin@mangaalam.com'").get();
    if (legacyAdmin && bcrypt.compareSync('Mangaalam@2026', legacyAdmin.password_hash)) {
      db.prepare("DELETE FROM admins WHERE id = ?").run(legacyAdmin.id);
      console.log('[Security Notice] Purged legacy default seed account to eliminate public default credentials.');
    }
  } catch (purgeErr) {
    // Ignore if not present
  }

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
  if (adminCount === 0) {
    console.log('----------------------------------------------------------------------');
    console.log('[Security Notice] No private owner account found.');
    console.log('To set up your private owner account, run in your terminal:');
    console.log('  npm run admin:create');
    console.log('This ensures no default or hardcoded password ever exists.');
    console.log('----------------------------------------------------------------------');
  } else {
    console.log(`[Security] Private owner authentication ready (${adminCount} registered account).`);
  }

  // 4. Seed Payment Configs if empty
  const configCount = db.prepare('SELECT COUNT(*) as count FROM payment_configs').get().count;
  if (configCount === 0) {
    const insertConfig = db.prepare('INSERT INTO payment_configs (key, value, description) VALUES (?, ?, ?)');
    insertConfig.run('enable_cod', 'true', 'Enable Cash on Delivery option for orders');
    insertConfig.run('enable_manual_upi', 'true', 'Enable Manual UPI verification via Boutique Concierge');
    insertConfig.run('upi_vpa', process.env.UPI_VPA || 'mangaalam@upi', 'Virtual Payment Address for direct UPI transfers');
    insertConfig.run('upi_merchant_name', process.env.UPI_MERCHANT_NAME || 'MANGAALAM Perfumes', 'Merchant Name displayed in UPI apps');
    insertConfig.run('payment_gateway_provider', process.env.PAYMENT_GATEWAY_PROVIDER || 'manual', 'Online gateway provider (manual | razorpay | stripe)');
  }
}
