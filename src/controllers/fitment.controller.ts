import type { Request, Response } from 'express';
import { createFitment, getFitmentsByProduct, deleteFitment } from '../models/ProductFitment.js';

export const processFitments = async (req: Request, res: Response) => {
  const { productId } = req.params;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid productId' });
  }

  const { trimId, notes } = req.body;

  if (!trimId || typeof trimId !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid trimId' });
  }

  try {
    const newFitment = await createFitment(productId, trimId, notes);
    res.status(201).json({ success: true, data: newFitment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message });
  }
};
export const searchFitmentProducts = async (req: Request, res: Response) => {
  let { productId } = req.query;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId is required' });
  }

  if (Array.isArray(productId)) {
    productId = productId[0];
  }

  if (typeof productId !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid productId' });
  }

  try {
    const fitments = await getFitmentsByProduct(productId);
    res.status(200).json({ success: true, data: fitments });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message });
  }
};

export const removeFitment = async (req: Request, res: Response) => {
  const { fitmentId } = req.params;

  if (!fitmentId || typeof fitmentId !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid fitmentId' });
  }

  try {
    const deletedFitment = await deleteFitment(fitmentId);
    res.status(200).json({ success: true, data: deletedFitment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message });
  }
};