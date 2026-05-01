// ====================== routes/productFitment.routes.ts ======================

import { Router } from 'express';
import { processFitments, removeFitment, searchFitmentProducts } from '../controllers/fitment.controller.js';

const router = Router();

// Create a new fitment for a product
router.post('/:productId', processFitments);

// Get fitments for a product
router.get('/', searchFitmentProducts);

// Delete a fitment
router.delete('/:fitmentId', removeFitment);

export default router;