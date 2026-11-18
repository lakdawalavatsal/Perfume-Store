import express from 'express';
import { db } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { paymentService } from '../services/paymentService.js';

const router = express.Router();

/**
 * GET /api/payments/methods
 * Public: returns customer-facing payment options
 */
router.get('/methods', (req, res) => {
  try {
    const methods = paymentService.getAvailableMethods();
    res.json({
      success: true,
      methods
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve payment options.' });
  }
});

/**
 * GET /api/admin/payments/config
 * Admin: retrieve payment settings
 */
router.get('/config', requireAdmin, (req, res) => {
  try {
    const configs = db.prepare('SELECT key, value, description, updated_at FROM payment_configs').all();
    const configMap = {};
    for (const c of configs) configMap[c.key] = c.value;

    res.json({
      success: true,
      configs: configMap,
      raw: configs,
      gatewayProvider: process.env.PAYMENT_GATEWAY_PROVIDER || 'manual',
      isGatewayKeySet: Boolean(process.env.PAYMENT_GATEWAY_KEY_ID)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load payment configuration.' });
  }
});

/**
 * PATCH /api/admin/payments/config
 * Admin: update payment configuration keys
 */
router.patch('/config', requireAdmin, (req, res) => {
  try {
    const { enable_cod, enable_manual_upi, upi_vpa, upi_merchant_name } = req.body;

    const updateConfig = db.prepare(`
      INSERT INTO payment_configs (key, value, description, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);

    if (enable_cod !== undefined) {
      updateConfig.run('enable_cod', String(Boolean(enable_cod)), 'Enable Cash on Delivery option');
    }

    if (enable_manual_upi !== undefined) {
      updateConfig.run('enable_manual_upi', String(Boolean(enable_manual_upi)), 'Enable Manual UPI verification');
    }

    if (upi_vpa !== undefined && typeof upi_vpa === 'string') {
      updateConfig.run('upi_vpa', upi_vpa.trim(), 'Boutique UPI VPA');
    }

    if (upi_merchant_name !== undefined && typeof upi_merchant_name === 'string') {
      updateConfig.run('upi_merchant_name', upi_merchant_name.trim(), 'Merchant name displayed on UPI apps');
    }

    res.json({
      success: true,
      message: 'Payment configuration updated successfully.'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
