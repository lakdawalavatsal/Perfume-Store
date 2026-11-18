import { db } from './index.js';
import { getSupabase, isSupabaseConfigured, testSupabaseConnection } from './supabaseClient.js';
import { paymentService } from '../services/paymentService.js';
import { generateOrderId, validateOrderInput } from '../services/orderService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mangaalam_luxury_secret_key_change_in_production_2026';

let activeProvider = isSupabaseConfigured() ? 'supabase' : 'sqlite';

/**
 * Repository layer providing authoritative access to either Supabase PostgreSQL
 * or local SQLite fallback (when Supabase credentials are not yet configured).
 */
export const repository = {
  /**
   * Determine current active database provider
   */
  async getActiveProvider() {
    if (!isSupabaseConfigured()) {
      return 'sqlite';
    }
    const test = await testSupabaseConnection();
    return test.connected ? 'supabase' : 'sqlite';
  },

  /**
   * Get comprehensive database health and connectivity status
   */
  async getHealth() {
    const supabaseConfigured = isSupabaseConfigured();
    const supabaseTest = await testSupabaseConnection();
    const provider = supabaseTest.connected ? 'supabase' : 'sqlite';

    let productCount = 0;
    let orderCount = 0;

    if (provider === 'supabase') {
      const client = getSupabase();
      const pRes = await client.from('products').select('*', { count: 'exact', head: true });
      const oRes = await client.from('orders').select('*', { count: 'exact', head: true });
      productCount = pRes.count || 0;
      orderCount = oRes.count || 0;
    } else {
      productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
      orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
    }

    return {
      status: 'healthy',
      brand: 'MANGAALAM Perfumes',
      activeProvider: provider,
      supabase: {
        configured: supabaseConfigured,
        connected: supabaseTest.connected,
        status: supabaseTest.status,
        message: supabaseTest.message || (supabaseTest.connected ? 'Connected to Supabase PostgreSQL' : 'Pending configuration'),
        latencyMs: supabaseTest.latencyMs || null
      },
      catalogSize: productCount,
      totalOrders: orderCount,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Fetch all active products for the storefront
   */
  async getAllProducts() {
    const provider = await this.getActiveProvider();

    if (provider === 'supabase') {
      const client = getSupabase();
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw new Error(`Supabase products fetch failed: ${error.message}`);

      return (data || []).map(p => ({
        ...p,
        price: Number(p.price_in_rupees || (p.price_in_paise / 100)),
        price_in_paise: Number(p.price_in_paise),
        formattedPrice: `₹${Number(p.price_in_rupees || (p.price_in_paise / 100))}`,
        inStock: p.stock > 0,
        availableUnits: p.stock
      }));
    }

    // SQLite Fallback
    const rows = db.prepare(`
      SELECT * FROM products
      WHERE is_active = 1
      ORDER BY category ASC, id ASC
    `).all();

    return rows.map(p => {
      const priceRupees = p.price;
      const pricePaise = p.price_in_paise || (priceRupees * 100);
      return {
        ...p,
        price: priceRupees,
        price_in_paise: pricePaise,
        formattedPrice: `₹${priceRupees}`,
        inStock: p.stock > 0,
        availableUnits: p.stock
      };
    });
  },

  /**
   * Fetch a single product by ID
   */
  async getProductById(productId) {
    const provider = await this.getActiveProvider();

    if (provider === 'supabase') {
      const client = getSupabase();
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;
      return {
        ...data,
        price: Number(data.price_in_rupees || (data.price_in_paise / 100)),
        price_in_paise: Number(data.price_in_paise),
        formattedPrice: `₹${Number(data.price_in_rupees || (data.price_in_paise / 100))}`,
        inStock: data.stock > 0,
        availableUnits: data.stock
      };
    }

    const row = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(productId);
    if (!row) return null;

    return {
      ...row,
      price: row.price,
      price_in_paise: row.price_in_paise || (row.price * 100),
      formattedPrice: `₹${row.price}`,
      inStock: row.stock > 0,
      availableUnits: row.stock
    };
  },

  /**
   * Create an order with atomic inventory decrement & server-side price calculation
   */
  async createOrder(rawInput, idempotencyKey = null) {
    const { isValid, errors, sanitized } = validateOrderInput(rawInput);
    if (!isValid) {
      const err = new Error(errors[0]);
      err.validationErrors = errors;
      err.status = 400;
      throw err;
    }

    const orderId = generateOrderId();
    const effectiveIdempotencyKey = idempotencyKey || rawInput.idempotency_key || `idemp-${orderId}`;
    const provider = await this.getActiveProvider();

    if (provider === 'supabase') {
      const client = getSupabase();

      // Call the atomic stored function create_order_atomic in Supabase
      const { data, error } = await client.rpc('create_order_atomic', {
        p_order_id: orderId,
        p_customer_name: sanitized.customer_name,
        p_phone: sanitized.phone,
        p_email: sanitized.email,
        p_address_line1: sanitized.address_line1,
        p_address_line2: sanitized.address_line2,
        p_city: sanitized.city,
        p_state: sanitized.state,
        p_pincode: sanitized.pincode,
        p_order_notes: sanitized.order_notes,
        p_payment_method: sanitized.payment_method,
        p_items: sanitized.items.map(it => ({ id: it.id, quantity: it.quantity })),
        p_idempotency_key: effectiveIdempotencyKey
      });

      if (error) {
        const customErr = new Error(error.message);
        customErr.status = 400;
        throw customErr;
      }

      // Fetch the full order record with items
      const fullOrder = await this.getOrderById(data.id || orderId);
      const paymentDetails = paymentService.processOrderPayment(fullOrder, sanitized.payment_method);

      return {
        success: true,
        provider: 'supabase',
        order: fullOrder,
        payment: paymentDetails
      };
    }

    // SQLite Fallback
    // Check idempotency first in SQLite
    const existing = db.prepare('SELECT id FROM orders WHERE idempotency_key = ?').get(effectiveIdempotencyKey);
    if (existing) {
      const existingOrder = await this.getOrderById(existing.id);
      return {
        success: true,
        provider: 'sqlite',
        idempotency_hit: true,
        order: existingOrder,
        payment: paymentService.processOrderPayment(existingOrder, existingOrder.payment_method)
      };
    }

    const executeOrderTransaction = db.transaction(() => {
      let subtotalPaise = 0;
      const validatedItems = [];

      for (const item of sanitized.items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.id);
        if (!product || !product.is_active) {
          throw new Error(`The fragrance "${item.name || item.id}" is currently not available.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Only ${product.stock} units of "${product.name} (${product.size})" are available in stock. You requested ${item.quantity}.`);
        }

        const unitPaise = product.price_in_paise || (product.price * 100);
        const itemTotalPaise = unitPaise * item.quantity;
        subtotalPaise += itemTotalPaise;

        validatedItems.push({
          product_id: product.id,
          product_name: product.name,
          product_size: product.size,
          unit_price: product.price,
          unit_price_in_paise: unitPaise,
          quantity: item.quantity,
          total_price: product.price * item.quantity,
          line_total_in_paise: itemTotalPaise,
          image_url: product.bottle_image
        });
      }

      const shippingPaise = 0;
      const totalPaise = subtotalPaise + shippingPaise;
      const subtotalRupees = Math.round(subtotalPaise / 100);
      const totalRupees = Math.round(totalPaise / 100);

      // Decrement inventory atomically
      const updateStock = db.prepare("UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?");
      for (const item of validatedItems) {
        updateStock.run(item.quantity, item.product_id);
      }

      // Insert Order
      db.prepare(`
        INSERT INTO orders (
          id, customer_name, phone, email, address_line1, address_line2,
          city, state, pincode, order_notes, subtotal, shipping_fee, total_amount,
          subtotal_in_paise, shipping_fee_in_paise, total_amount_in_paise,
          payment_method, payment_status, order_status, idempotency_key
        ) VALUES (
          @id, @customer_name, @phone, @email, @address_line1, @address_line2,
          @city, @state, @pincode, @order_notes, @subtotal, @shipping_fee, @total_amount,
          @subtotal_in_paise, @shipping_fee_in_paise, @total_amount_in_paise,
          @payment_method, @payment_status, @order_status, @idempotency_key
        )
      `).run({
        id: orderId,
        customer_name: sanitized.customer_name,
        phone: sanitized.phone,
        email: sanitized.email,
        address_line1: sanitized.address_line1,
        address_line2: sanitized.address_line2,
        city: sanitized.city,
        state: sanitized.state,
        pincode: sanitized.pincode,
        order_notes: sanitized.order_notes,
        subtotal: subtotalRupees,
        shipping_fee: 0,
        total_amount: totalRupees,
        subtotal_in_paise: subtotalPaise,
        shipping_fee_in_paise: shippingPaise,
        total_amount_in_paise: totalPaise,
        payment_method: sanitized.payment_method,
        payment_status: 'pending',
        order_status: 'New',
        idempotency_key: effectiveIdempotencyKey
      });

      // Insert Items
      const insertItem = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_size,
          unit_price, quantity, total_price, image_url,
          product_name_snapshot, size_snapshot, unit_price_in_paise, line_total_in_paise
        ) VALUES (
          @order_id, @product_id, @product_name, @product_size,
          @unit_price, @quantity, @total_price, @image_url,
          @product_name_snapshot, @size_snapshot, @unit_price_in_paise, @line_total_in_paise
        )
      `);

      for (const item of validatedItems) {
        insertItem.run({
          order_id: orderId,
          product_id: item.product_id,
          product_name: item.product_name,
          product_size: item.product_size,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: item.total_price,
          image_url: item.image_url,
          product_name_snapshot: item.product_name,
          size_snapshot: item.product_size,
          unit_price_in_paise: item.unit_price_in_paise,
          line_total_in_paise: item.line_total_in_paise
        });
      }
    });

    executeOrderTransaction();

    const createdOrder = await this.getOrderById(orderId);
    const paymentDetails = paymentService.processOrderPayment(createdOrder, sanitized.payment_method);

    return {
      success: true,
      provider: 'sqlite',
      order: createdOrder,
      payment: paymentDetails
    };
  },

  /**
   * Retrieve order details for customer tracking / confirmation
   */
  async getOrderById(orderId) {
    const provider = await this.getActiveProvider();

    if (provider === 'supabase') {
      const client = getSupabase();
      const { data: order, error: orderErr } = await client
        .from('orders')
        .select(`
          id, customer_name, phone, email, address_line1, address_line2,
          city, state, pincode, order_notes, subtotal_in_paise, shipping_fee_in_paise,
          total_amount_in_paise, subtotal_in_rupees, total_amount_in_rupees,
          payment_method, payment_status, order_status, shipping_provider, tracking_number,
          created_at, updated_at
        `)
        .eq('id', orderId)
        .single();

      if (orderErr || !order) return null;

      const { data: items } = await client
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      return {
        ...order,
        subtotal: Number(order.subtotal_in_rupees || (order.subtotal_in_paise / 100)),
        total_amount: Number(order.total_amount_in_rupees || (order.total_amount_in_paise / 100)),
        shipping_fee: 0,
        items: (items || []).map(it => ({
          ...it,
          product_name: it.product_name_snapshot || it.product_name,
          product_size: it.size_snapshot || it.product_size,
          unit_price: Number(it.unit_price_in_rupees || (it.unit_price_in_paise / 100)),
          total_price: Number(it.line_total_in_rupees || (it.line_total_in_paise / 100))
        }))
      };
    }

    // SQLite Fallback
    const order = db.prepare(`
      SELECT 
        id, customer_name, phone, email, address_line1, address_line2,
        city, state, pincode, order_notes, subtotal, shipping_fee, total_amount,
        subtotal_in_paise, shipping_fee_in_paise, total_amount_in_paise,
        payment_method, payment_status, order_status, shipping_provider, tracking_number,
        created_at, updated_at
      FROM orders WHERE id = ?
    `).get(orderId);

    if (!order) return null;

    const items = db.prepare(`
      SELECT 
        id, product_id, product_name, product_size, unit_price, quantity, total_price, image_url,
        product_name_snapshot, size_snapshot, unit_price_in_paise, line_total_in_paise
      FROM order_items WHERE order_id = ?
    `).all(orderId);

    return {
      ...order,
      subtotal: Number(order.subtotal ?? (order.subtotal_in_paise ? order.subtotal_in_paise / 100 : 0)),
      total_amount: Number(order.total_amount ?? (order.total_amount_in_paise ? order.total_amount_in_paise / 100 : 0)),
      subtotal_in_paise: order.subtotal_in_paise != null ? Number(order.subtotal_in_paise) : Math.round(Number(order.subtotal || 0) * 100),
      shipping_fee_in_paise: order.shipping_fee_in_paise != null ? Number(order.shipping_fee_in_paise) : Math.round(Number(order.shipping_fee || 0) * 100),
      total_amount_in_paise: order.total_amount_in_paise != null ? Number(order.total_amount_in_paise) : Math.round(Number(order.total_amount || 0) * 100),
      items: items.map(it => ({
        ...it,
        product_name: it.product_name_snapshot || it.product_name,
        product_size: it.size_snapshot || it.product_size,
        unit_price: Number(it.unit_price ?? (it.unit_price_in_paise ? it.unit_price_in_paise / 100 : 0)),
        total_price: Number(it.total_price ?? (it.line_total_in_paise ? it.line_total_in_paise / 100 : 0)),
        unit_price_in_paise: it.unit_price_in_paise != null ? Number(it.unit_price_in_paise) : Math.round(Number(it.unit_price || 0) * 100),
        line_total_in_paise: it.line_total_in_paise != null ? Number(it.line_total_in_paise) : Math.round(Number(it.total_price || 0) * 100)
      }))
    };
  },

  /**
   * Retrieve orders for authorized admin with search and filters
   */
  async getAdminOrders({ search, order_status, payment_status, limit = 50, offset = 0 } = {}) {
    const provider = await this.getActiveProvider();

    if (provider === 'supabase') {
      const client = getSupabase();
      let query = client
        .from('orders')
        .select(`
          id, customer_name, phone, email, city, state, pincode,
          subtotal_in_paise, total_amount_in_paise, subtotal_in_rupees, total_amount_in_rupees,
          payment_method, payment_status, order_status, shipping_provider, tracking_number,
          admin_notes, created_at, updated_at,
          order_items (
            id, product_id, product_name_snapshot, size_snapshot, unit_price_in_paise,
            quantity, line_total_in_paise, image_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (order_status && order_status !== 'all') {
        query = query.eq('order_status', order_status);
      }
      if (payment_status && payment_status !== 'all') {
        query = query.eq('payment_status', payment_status);
      }
      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(`id.ilike.%${s}%,customer_name.ilike.%${s}%,phone.ilike.%${s}%,city.ilike.%${s}%,tracking_number.ilike.%${s}%`);
      }

      const { data, error } = await query;
      if (error) throw new Error(`Supabase orders query failed: ${error.message}`);

      const enriched = (data || []).map(ord => ({
        ...ord,
        subtotal: Number(ord.subtotal_in_rupees || (ord.subtotal_in_paise / 100)),
        total_amount: Number(ord.total_amount_in_rupees || (ord.total_amount_in_paise / 100)),
        item_count: (ord.order_items || []).length,
        items: (ord.order_items || []).map(it => ({
          ...it,
          product_name: it.product_name_snapshot,
          product_size: it.size_snapshot,
          unit_price: Number(it.unit_price_in_paise / 100),
          total_price: Number(it.line_total_in_paise / 100)
        }))
      }));

      return { count: enriched.length, orders: enriched };
    }

    // SQLite Fallback
    let sql = `
      SELECT 
        o.id, o.customer_name, o.phone, o.email, o.city, o.state, o.pincode,
        o.subtotal, o.shipping_fee, o.total_amount,
        o.subtotal_in_paise, o.shipping_fee_in_paise, o.total_amount_in_paise,
        o.payment_method, o.payment_status,
        o.order_status, o.shipping_provider, o.tracking_number, o.created_at, o.updated_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (o.id LIKE ? OR o.customer_name LIKE ? OR o.phone LIKE ? OR o.city LIKE ? OR o.tracking_number LIKE ?)`;
      params.push(term, term, term, term, term);
    }
    if (order_status && order_status !== 'all') {
      sql += ` AND o.order_status = ?`;
      params.push(order_status);
    }
    if (payment_status && payment_status !== 'all') {
      sql += ` AND o.payment_status = ?`;
      params.push(payment_status);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const orders = db.prepare(sql).all(...params);
    const getItemsStmt = db.prepare(`
      SELECT 
        id, product_id, product_name, product_size, unit_price, quantity, total_price, image_url,
        product_name_snapshot, size_snapshot, unit_price_in_paise, line_total_in_paise
      FROM order_items WHERE order_id = ?
    `);

    const enriched = orders.map(ord => ({
      ...ord,
      subtotal: Number(ord.subtotal ?? (ord.subtotal_in_paise ? ord.subtotal_in_paise / 100 : 0)),
      total_amount: Number(ord.total_amount ?? (ord.total_amount_in_paise ? ord.total_amount_in_paise / 100 : 0)),
      subtotal_in_paise: ord.subtotal_in_paise != null ? Number(ord.subtotal_in_paise) : Math.round(Number(ord.subtotal || 0) * 100),
      total_amount_in_paise: ord.total_amount_in_paise != null ? Number(ord.total_amount_in_paise) : Math.round(Number(ord.total_amount || 0) * 100),
      items: getItemsStmt.all(ord.id).map(it => ({
        ...it,
        product_name: it.product_name_snapshot || it.product_name,
        product_size: it.size_snapshot || it.product_size,
        unit_price: Number(it.unit_price ?? (it.unit_price_in_paise ? it.unit_price_in_paise / 100 : 0)),
        total_price: Number(it.total_price ?? (it.line_total_in_paise ? it.line_total_in_paise / 100 : 0)),
        unit_price_in_paise: it.unit_price_in_paise != null ? Number(it.unit_price_in_paise) : Math.round(Number(it.unit_price || 0) * 100),
        line_total_in_paise: it.line_total_in_paise != null ? Number(it.line_total_in_paise) : Math.round(Number(it.total_price || 0) * 100)
      }))
    }));

    return { count: enriched.length, orders: enriched };
  },

  /**
   * Get KPI statistics for Admin Dashboard
   */
  async getAdminStats() {
    const provider = await this.getActiveProvider();

    if (provider === 'supabase') {
      const client = getSupabase();
      const [allOrdersRes, newOrdersRes, pendingPaymentRes, lowStockRes] = await Promise.all([
        client.from('orders').select('total_amount_in_paise, order_status'),
        client.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'New'),
        client.from('orders').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending').neq('order_status', 'Cancelled'),
        client.from('products').select('*').lte('stock', 5).eq('is_active', true).order('stock', { ascending: true })
      ]);

      const ordersData = allOrdersRes.data || [];
      const totalOrders = ordersData.length;
      const totalRevenuePaise = ordersData
        .filter(o => o.order_status !== 'Cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount_in_paise || 0), 0);
      const totalRevenue = Math.round(totalRevenuePaise / 100);

      const lowStockProducts = (lowStockRes.data || []).map(p => ({
        ...p,
        price: Number(p.price_in_rupees || (p.price_in_paise / 100))
      }));

      return {
        totalOrders,
        totalRevenue,
        newOrders: newOrdersRes.count || 0,
        pendingPayment: pendingPaymentRes.count || 0,
        lowStockCount: lowStockProducts.length,
        lowStockProducts
      };
    }

    // SQLite Fallback
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue 
      FROM orders 
      WHERE order_status != 'Cancelled'
    `).get().revenue;

    const newOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'New'").get().count;
    const pendingPayment = db.prepare("SELECT COUNT(*) as count FROM orders WHERE payment_status = 'pending' AND order_status != 'Cancelled'").get().count;

    const lowStockProducts = db.prepare(`
      SELECT id, name, size, stock, low_stock_threshold, price, bottle_image
      FROM products
      WHERE stock <= low_stock_threshold AND is_active = 1
      ORDER BY stock ASC
    `).all();

    return {
      totalOrders,
      totalRevenue,
      newOrders,
      pendingPayment,
      lowStockCount: lowStockProducts.length,
      lowStockProducts
    };
  },

  /**
   * Update order lifecycle status with automatic stock restoration if Cancelled
   */
  async updateOrderStatus(orderId, status, note = '', shipping_provider = null, tracking_number = null, admin = {}) {
    const provider = await this.getActiveProvider();

    if (provider === 'supabase') {
      const client = getSupabase();

      // If cancelling and not already cancelled, restore inventory
      if (status === 'Cancelled') {
        const { data: currentOrder } = await client
          .from('orders')
          .select('order_status')
          .eq('id', orderId)
          .single();

        if (currentOrder && currentOrder.order_status !== 'Cancelled') {
          const { data: items } = await client
            .from('order_items')
            .select('product_id, quantity')
            .eq('order_id', orderId);

          if (items) {
            for (const it of items) {
              const { data: p } = await client
                .from('products')
                .select('stock')
                .eq('id', it.product_id)
                .single();

              if (p && typeof p.stock === 'number') {
                await client
                  .from('products')
                  .update({
                    stock: p.stock + it.quantity,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', it.product_id);
              }
            }
          }
        }
      }

      const updates = {
        order_status: status,
        updated_at: new Date().toISOString()
      };
      if (shipping_provider !== undefined && shipping_provider !== null) updates.shipping_provider = shipping_provider;
      if (tracking_number !== undefined && tracking_number !== null) updates.tracking_number = tracking_number;
      if (note) {
        updates.admin_notes = `[${new Date().toISOString()}] Updated to "${status}" by ${admin.name || admin.email || 'Admin'}. ${note}`.trim();
      }

      const { error } = await client.from('orders').update(updates).eq('id', orderId);
      if (error) throw new Error(error.message);

      return this.getOrderById(orderId);
    }

    // SQLite Fallback
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) throw new Error('Order not found');

    if (status === 'Cancelled' && order.order_status !== 'Cancelled') {
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId);
      db.transaction(() => {
        const restoreStock = db.prepare("UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?");
        for (const it of items) {
          restoreStock.run(it.quantity, it.product_id);
        }
        const logNote = `[${new Date().toISOString()}] Cancelled by ${admin.name || admin.email}. Reason: ${note || 'Admin requested cancellation'}`;
        db.prepare(`
          UPDATE orders 
          SET order_status = 'Cancelled', admin_notes = COALESCE(admin_notes || '\n', '') || ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(logNote, orderId);
      })();
      return this.getOrderById(orderId);
    }

    let updateQuery = "UPDATE orders SET order_status = ?, updated_at = datetime('now')";
    const params = [status];

    if (note) {
      updateQuery += ", admin_notes = COALESCE(admin_notes || '\n', '') || ?";
      params.push(`[${new Date().toISOString()}] Status updated to "${status}" by ${admin.name || admin.email}. ${note}`.trim());
    }
    if (shipping_provider !== undefined) {
      updateQuery += ", shipping_provider = ?";
      params.push(shipping_provider);
    }
    if (tracking_number !== undefined) {
      updateQuery += ", tracking_number = ?";
      params.push(tracking_number);
    }

    updateQuery += " WHERE id = ?";
    params.push(orderId);

    db.prepare(updateQuery).run(...params);
    return this.getOrderById(orderId);
  },

  /**
   * Update payment status
   */
  async updateOrderPayment(orderId, payment_status, note = '', admin = {}) {
    const provider = await this.getActiveProvider();

    if (provider === 'supabase') {
      const client = getSupabase();
      const updates = {
        payment_status,
        updated_at: new Date().toISOString()
      };
      if (note) {
        updates.admin_notes = `[${new Date().toISOString()}] Payment marked as ${payment_status} by ${admin.name || admin.email}. ${note}`.trim();
      }
      const { error } = await client.from('orders').update(updates).eq('id', orderId);
      if (error) throw new Error(error.message);

      return this.getOrderById(orderId);
    }

    // SQLite Fallback
    paymentService.verifyPaymentByAdmin(orderId, admin, payment_status, note);
    return this.getOrderById(orderId);
  },

  /**
   * Update inventory stock for a fragrance
   */
  async updateProductStock(productId, stock, lowStockThreshold = null) {
    const provider = await this.getActiveProvider();

    if (provider === 'supabase') {
      const client = getSupabase();
      const updates = {
        stock: Math.floor(stock),
        updated_at: new Date().toISOString()
      };
      if (lowStockThreshold !== null) {
        updates.low_stock_threshold = Math.floor(lowStockThreshold);
      }
      const { data, error } = await client.from('products').update(updates).eq('id', productId).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    // SQLite Fallback
    let sql = "UPDATE products SET stock = ?, updated_at = datetime('now')";
    const params = [Math.floor(stock)];
    if (lowStockThreshold !== null) {
      sql += ", low_stock_threshold = ?";
      params.push(Math.floor(lowStockThreshold));
    }
    sql += " WHERE id = ?";
    params.push(productId);

    db.prepare(sql).run(...params);
    return db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  },

  /**
   * Check if owner account exists
   */
  async hasOwner() {
    const provider = await this.getActiveProvider();
    if (provider === 'supabase') {
      const client = getSupabase();
      const { count } = await client.from('admin_profiles').select('*', { count: 'exact', head: true });
      return (count || 0) > 0;
    }
    const count = db.prepare('SELECT COUNT(*) as c FROM admins').get().c;
    return count > 0;
  }
};
