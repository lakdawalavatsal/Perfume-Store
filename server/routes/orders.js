import express from 'express';
import { repository } from '../db/repository.js';

const router = express.Router();

/**
 * POST /api/orders
 * Customer Checkout submission with server-side validation & atomic inventory reservation
 */
router.post('/', async (req, res) => {
  try {
    const idempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotency_key || null;
    const result = await repository.createOrder(req.body, idempotencyKey);

    res.status(201).json({
      success: true,
      message: 'Your fragrance order has been successfully placed!',
      order: result.order,
      payment: result.payment,
      provider: result.provider,
      idempotencyHit: Boolean(result.idempotency_hit)
    });
  } catch (error) {
    console.error('Order creation error:', error.message);
    const statusCode = error.status || 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      validationErrors: error.validationErrors || null
    });
  }
});

/**
 * GET /api/orders/:id
 * Customer order confirmation / tracking view (safe public fields only)
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await repository.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found. Please verify your Order ID.'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Fetch order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve order confirmation details.'
    });
  }
});

export default router;
