import { db } from '../db/index.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Payment Service Abstraction Layer
 * Supports Cash on Delivery (COD), Manual UPI / Boutique Concierge Verification,
 * and extensible online payment gateway adapters (Razorpay / Stripe).
 * Secret keys and signature verifications remain strictly on the backend.
 */
class PaymentService {
  constructor() {
    this.provider = process.env.PAYMENT_GATEWAY_PROVIDER || 'manual';
    this.keyId = process.env.PAYMENT_GATEWAY_KEY_ID || '';
    this.keySecret = process.env.PAYMENT_GATEWAY_KEY_SECRET || '';
  }

  /**
   * Get public payment methods available to customers
   */
  getAvailableMethods() {
    const configs = db.prepare('SELECT key, value FROM payment_configs').all();
    const configMap = {};
    for (const c of configs) configMap[c.key] = c.value;

    const methods = [];

    // 1. Cash on Delivery
    if (configMap['enable_cod'] !== 'false') {
      methods.push({
        id: 'cod',
        name: 'Cash on Delivery (COD)',
        description: 'Pay comfortably upon physical delivery at your doorstep.',
        badge: 'Recommended',
        fee: 0,
        requiresImmediatePayment: false
      });
    }

    // 2. Direct UPI / Boutique Concierge Transfer
    if (configMap['enable_manual_upi'] !== 'false') {
      const vpa = configMap['upi_vpa'] || 'mangaalam@upi';
      const merchant = configMap['upi_merchant_name'] || 'MANGAALAM Perfumes';
      methods.push({
        id: 'manual_upi',
        name: 'Direct UPI / Boutique Desk Transfer',
        description: `Direct transfer to official boutique VPA (${vpa}) via Google Pay, PhonePe, Paytm, or BHIM.`,
        vpa,
        merchantName: merchant,
        badge: 'Zero Convenience Fee',
        fee: 0,
        requiresImmediatePayment: true
      });
    }

    // 3. Online Gateway Adapter (Configurable for Razorpay/Stripe)
    const isOnlineConfigured = Boolean(this.keyId && this.keySecret && this.provider !== 'manual');
    methods.push({
      id: 'online_gateway',
      name: 'Credit / Debit Card / Netbanking',
      description: isOnlineConfigured 
        ? 'Instant secure payment via accredited payment gateway.'
        : 'Online gateway integration ready (Configurable in admin settings).',
      enabled: isOnlineConfigured,
      badge: isOnlineConfigured ? 'Instant Confirmation' : 'Setup via .env',
      provider: this.provider,
      fee: 0,
      requiresImmediatePayment: true
    });

    return methods;
  }

  /**
   * Initialize payment handling for a created order
   */
  processOrderPayment(order, paymentMethod) {
    if (paymentMethod === 'cod') {
      return {
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        instructions: `Your order for ₹${order.total_amount} is booked under Cash on Delivery. Please keep exact cash or UPI ready at the time of delivery.`,
        nextStep: 'awaiting_dispatch'
      };
    }

    if (paymentMethod === 'manual_upi') {
      const vpa = process.env.UPI_VPA || 'mangaalam@upi';
      const merchant = process.env.UPI_MERCHANT_NAME || 'MANGAALAM Perfumes';
      const upiUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchant)}&am=${order.total_amount}&cu=INR&tn=${encodeURIComponent(`Order ${order.id}`)}`;

      return {
        paymentMethod: 'manual_upi',
        paymentStatus: 'pending',
        vpa,
        merchantName: merchant,
        upiUrl,
        amount: order.total_amount,
        instructions: `Please transfer ₹${order.total_amount} to ${vpa} with Order ID ${order.id} in the reference note. Our concierge desk will verify and confirm your order promptly.`,
        nextStep: 'awaiting_manual_verification'
      };
    }

    if (paymentMethod === 'online_gateway') {
      if (!this.keyId || !this.keySecret) {
        return {
          paymentMethod: 'online_gateway',
          paymentStatus: 'pending',
          error: 'Online payment gateway credentials are not yet configured in server environment. Please use Cash on Delivery or Direct UPI.',
          fallbackMethod: 'cod'
        };
      }

      // Structure ready for Razorpay/Stripe initialization:
      return {
        paymentMethod: 'online_gateway',
        paymentStatus: 'pending',
        gatewayOrderId: `mock_gw_${order.id}`,
        keyId: this.keyId,
        amount: order.total_amount * 100, // paise / cents
        currency: 'INR',
        instructions: 'Complete payment in the secure gateway modal.'
      };
    }

    throw new Error(`Unsupported payment method: ${paymentMethod}`);
  }

  /**
   * Admin verification of manual payment
   */
  verifyPaymentByAdmin(orderId, adminInfo, status = 'paid', note = '') {
    const order = db.prepare('SELECT id, payment_status, total_amount FROM orders WHERE id = ?').get(orderId);
    if (!order) throw new Error('Order not found');

    const updateStmt = db.prepare(`
      UPDATE orders 
      SET payment_status = ?, 
          admin_notes = COALESCE(admin_notes || '\n', '') || ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    const logEntry = `[${new Date().toISOString()}] Payment marked as ${status} by ${adminInfo.name || adminInfo.email}. ${note}`.trim();
    updateStmt.run(status, logEntry, orderId);

    return {
      orderId,
      previousStatus: order.payment_status,
      newStatus: status
    };
  }
}

export const paymentService = new PaymentService();
