import { db } from '../db/index.js';
import { paymentService } from './paymentService.js';

/**
 * Generate a unique, luxury-branded Order ID
 * Format: MNG-YYYYMMDD-XXXX (e.g., MNG-20261116-8342)
 */
export function generateOrderId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MNG-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Validate customer checkout input fields server-side
 */
export function validateOrderInput(data) {
  const errors = [];

  // Customer Name
  if (!data.customer_name || typeof data.customer_name !== 'string' || data.customer_name.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters).');
  }

  // Phone: Indian 10-digit mobile number validation
  const phoneClean = (data.phone || '').replace(/[\s\-\+]/g, '');
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneClean || !phoneRegex.test(phoneClean)) {
    errors.push('Please enter a valid 10-digit mobile number (starting with 6, 7, 8, or 9).');
  }

  // Email (optional, but if provided must be valid)
  if (data.email && data.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Please provide a valid email address.');
    }
  }

  // Delivery Address
  if (!data.address_line1 || data.address_line1.trim().length < 5) {
    errors.push('Delivery street address is required.');
  }

  if (!data.city || data.city.trim().length < 2) {
    errors.push('City is required.');
  }

  if (!data.state || data.state.trim().length < 2) {
    errors.push('State is required.');
  }

  // Pincode: 6 digits
  const pinClean = (data.pincode || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(pinClean)) {
    errors.push('Please enter a valid 6-digit postal pincode.');
  }

  // Items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Your bag is empty. Please select at least one fragrance.');
  } else {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.id || typeof item.id !== 'string') {
        errors.push(`Item #${i + 1} is missing a valid product ID.`);
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        errors.push(`Invalid quantity for item #${i + 1}.`);
      }
    }
  }

  // Payment Method
  const validMethods = ['cod', 'manual_upi', 'online_gateway'];
  if (!data.payment_method || !validMethods.includes(data.payment_method)) {
    errors.push('Please select a valid payment method (Cash on Delivery or Direct UPI).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      customer_name: (data.customer_name || '').trim(),
      phone: phoneClean,
      email: (data.email || '').trim().toLowerCase() || null,
      address_line1: (data.address_line1 || '').trim(),
      address_line2: (data.address_line2 || '').trim() || null,
      city: (data.city || '').trim(),
      state: (data.state || '').trim(),
      pincode: pinClean,
      order_notes: (data.order_notes || '').trim() || null,
      payment_method: data.payment_method,
      items: data.items || []
    }
  };
}

/**
 * Create Order with Atomic Inventory Decrement
 */
export function createOrder(rawInput, clientIp = null) {
  const { isValid, errors, sanitized } = validateOrderInput(rawInput);
  if (!isValid) {
    const error = new Error(errors[0]);
    error.validationErrors = errors;
    error.status = 400;
    throw error;
  }

  const orderId = generateOrderId();

  // Execute database transaction
  const executeOrderTransaction = db.transaction(() => {
    let subtotal = 0;
    const validatedItems = [];

    // 1. Verify stock and calculate authoritative prices from DB
    for (const item of sanitized.items) {
      const product = db.prepare(`
        SELECT id, name, slug, size, volume_ml, price, stock, bottle_image, is_active
        FROM products WHERE id = ?
      `).get(item.id);

      if (!product || !product.is_active) {
        throw new Error(`The fragrance "${item.name || item.id}" is currently not available for purchase.`);
      }

      if (product.stock < item.quantity) {
        if (product.stock === 0) {
          throw new Error(`"${product.name} (${product.size})" is currently out of stock.`);
        } else {
          throw new Error(`Only ${product.stock} units of "${product.name} (${product.size})" are available in stock. You requested ${item.quantity}.`);
        }
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_size: product.size,
        unit_price: product.price,
        quantity: item.quantity,
        total_price: itemTotal,
        image_url: product.bottle_image
      });
    }

    const shippingFee = 0; // Complimentary luxury courier delivery across India
    const totalAmount = subtotal + shippingFee;

    // 2. Decrement inventory atomically
    const updateStockStmt = db.prepare(`
      UPDATE products 
      SET stock = stock - ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    for (const item of validatedItems) {
      updateStockStmt.run(item.quantity, item.product_id);
    }

    // 3. Insert order record
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (
        id, customer_name, phone, email, address_line1, address_line2,
        city, state, pincode, order_notes, subtotal, shipping_fee, total_amount,
        payment_method, payment_status, order_status
      ) VALUES (
        @id, @customer_name, @phone, @email, @address_line1, @address_line2,
        @city, @state, @pincode, @order_notes, @subtotal, @shipping_fee, @total_amount,
        @payment_method, @payment_status, @order_status
      )
    `);

    insertOrderStmt.run({
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
      subtotal,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      payment_method: sanitized.payment_method,
      payment_status: 'pending',
      order_status: 'New'
    });

    // 4. Insert order items
    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, product_name, product_size, unit_price, quantity, total_price, image_url
      ) VALUES (
        @order_id, @product_id, @product_name, @product_size, @unit_price, @quantity, @total_price, @image_url
      )
    `);

    for (const item of validatedItems) {
      insertItemStmt.run({
        order_id: orderId,
        ...item
      });
    }

    return {
      orderId,
      subtotal,
      shippingFee,
      totalAmount,
      items: validatedItems
    };
  });

  const result = executeOrderTransaction();

  // Retrieve complete order details
  const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  // Process payment initialization (COD / UPI / Gateway)
  const paymentDetails = paymentService.processOrderPayment(createdOrder, sanitized.payment_method);

  return {
    success: true,
    order: {
      ...createdOrder,
      items: orderItems
    },
    payment: paymentDetails
  };
}

/**
 * Retrieve public order confirmation by order ID (safe customer view)
 */
export function getOrderById(orderId) {
  const order = db.prepare(`
    SELECT 
      id, customer_name, phone, email, address_line1, address_line2,
      city, state, pincode, order_notes, subtotal, shipping_fee, total_amount,
      payment_method, payment_status, order_status, shipping_provider, tracking_number,
      created_at
    FROM orders WHERE id = ?
  `).get(orderId);

  if (!order) return null;

  const items = db.prepare(`
    SELECT id, product_id, product_name, product_size, unit_price, quantity, total_price, image_url
    FROM order_items WHERE order_id = ?
  `).all(orderId);

  return {
    ...order,
    items
  };
}

/**
 * Cancel an order and restore stock (Admin action)
 */
export function cancelOrder(orderId, adminInfo, reason = '') {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw new Error('Order not found');

  if (order.order_status === 'Cancelled') {
    throw new Error('This order is already cancelled.');
  }

  const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId);

  const executeCancellation = db.transaction(() => {
    // 1. Restore stock
    const restoreStockStmt = db.prepare(`
      UPDATE products 
      SET stock = stock + ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    for (const item of items) {
      restoreStockStmt.run(item.quantity, item.product_id);
    }

    // 2. Update order status
    const logNote = `[${new Date().toISOString()}] Cancelled by ${adminInfo.name || adminInfo.email}. Reason: ${reason || 'Customer or admin requested cancellation'}`;
    db.prepare(`
      UPDATE orders 
      SET order_status = 'Cancelled',
          admin_notes = COALESCE(admin_notes || '\n', '') || ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(logNote, orderId);
  });

  executeCancellation();

  return getOrderById(orderId);
}
