import express from 'express';
import { repository } from '../db/repository.js';
import { requireAdmin } from '../middleware/auth.js';
import { testSupabaseConnection } from '../db/supabaseClient.js';

const router = express.Router();

// Protect all admin routes with JWT middleware
router.use(requireAdmin);

/**
 * GET /api/admin/db-status
 * Live database connectivity check (Supabase vs local SQLite)
 */
router.get('/db-status', async (req, res) => {
  try {
    const health = await repository.getHealth();
    res.json({
      success: true,
      ...health
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/stats
 * Dashboard Overview KPIs: total revenue, order counts, low stock alerts
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await repository.getAdminStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to compute dashboard metrics.' });
  }
});

/**
 * GET /api/admin/orders
 * List orders with search, status filtering, and pagination
 */
router.get('/orders', async (req, res) => {
  try {
    const { search, order_status, payment_status, limit = 50, offset = 0 } = req.query;
    const result = await repository.getAdminOrders({ search, order_status, payment_status, limit, offset });

    res.json({
      success: true,
      count: result.count,
      orders: result.orders
    });
  } catch (error) {
    console.error('Admin fetch orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve orders list.' });
  }
});

/**
 * GET /api/admin/orders/:id
 * Retrieve full order details including address, items, and internal audit notes
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await repository.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load order details.' });
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Update order lifecycle status: New, Confirmed, Packed, Shipped, Delivered, or Cancelled
 */
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status, note, shipping_provider, tracking_number } = req.body;
    const orderId = req.params.id;

    const validStatuses = ['New', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updated = await repository.updateOrderStatus(orderId, status, note, shipping_provider, tracking_number, req.admin);

    res.json({
      success: true,
      message: `Order status updated to ${status}.`,
      order: updated
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/admin/orders/:id/payment
 * Verify and update payment status
 */
router.patch('/orders/:id/payment', async (req, res) => {
  try {
    const { payment_status, note } = req.body;
    const orderId = req.params.id;

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updated = await repository.updateOrderPayment(orderId, payment_status, note, req.admin);

    res.json({
      success: true,
      message: `Payment status updated to ${payment_status}.`,
      order: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/admin/orders/:id/tracking
 * Update shipping provider and tracking number
 */
router.patch('/orders/:id/tracking', async (req, res) => {
  try {
    const { shipping_provider, tracking_number } = req.body;
    const orderId = req.params.id;

    if (!shipping_provider || !tracking_number) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both shipping carrier name and tracking number.'
      });
    }

    const updated = await repository.updateOrderStatus(
      orderId,
      'Shipped',
      `Dispatched via ${shipping_provider.trim()} (Tracking: ${tracking_number.trim()})`,
      shipping_provider.trim(),
      tracking_number.trim(),
      req.admin
    );

    res.json({
      success: true,
      message: 'Dispatch and tracking details saved successfully.',
      order: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/products
 * List all products for inventory management
 */
router.get('/products', async (req, res) => {
  try {
    const products = await repository.getAllProducts();

    res.json({
      success: true,
      products: products.map(p => ({
        ...p,
        isLowStock: p.stock <= (p.low_stock_threshold || 5),
        isOutOfStock: p.stock === 0
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load inventory.' });
  }
});

/**
 * PATCH /api/admin/products/:id/stock
 * Update stock count or low-stock threshold for a product
 */
router.patch('/products/:id/stock', async (req, res) => {
  try {
    const { stock, low_stock_threshold, adjustment } = req.body;
    const productId = req.params.id;

    const currentProduct = await repository.getProductById(productId);
    if (!currentProduct) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    let newStock = currentProduct.stock;
    if (typeof stock === 'number') {
      if (stock < 0) return res.status(400).json({ success: false, error: 'Stock cannot be negative.' });
      newStock = Math.floor(stock);
    } else if (typeof adjustment === 'number') {
      newStock = Math.max(0, currentProduct.stock + Math.floor(adjustment));
    }

    const updated = await repository.updateProductStock(productId, newStock, low_stock_threshold);

    res.json({
      success: true,
      message: `Stock for ${currentProduct.name} (${currentProduct.size}) updated to ${newStock} units.`,
      product: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
