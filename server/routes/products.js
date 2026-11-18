import express from 'express';
import { repository } from '../db/repository.js';

const router = express.Router();

/**
 * GET /api/products
 * Public endpoint to fetch all products with live stock information
 */
router.get('/', async (req, res) => {
  try {
    const products = await repository.getAllProducts();

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve fragrance catalog.' });
  }
});

/**
 * GET /api/products/:id
 * Public endpoint to fetch a single product with live stock
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await repository.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Fragrance not found.' });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve fragrance details.' });
  }
});

export default router;
