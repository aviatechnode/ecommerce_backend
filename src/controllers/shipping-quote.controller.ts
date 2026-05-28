import type { Response } from "express";
import { ShippingQuoteService } from "../services/shipment/shipping-quote.service.js";
import {
  createShippingQuoteSchema,
  updateShippingQuoteSchema,
} from "../schemas/shipment/shipping-quote.schema.js";

import type { TypedRequest } from "../types/express.js";

export class ShippingQuoteController {
  static async create(
    req: TypedRequest<{}, typeof createShippingQuoteSchema._input>,
    res: Response
  ) {
    try {
      const validated = createShippingQuoteSchema.parse(req.body);

      const shippingQuote = await ShippingQuoteService.create(validated);

      return res.status(201).json({
        success: true,
        data: shippingQuote,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async findAll(req: TypedRequest, res: Response) {
    try {
      const shippingQuotes = await ShippingQuoteService.findAll();

      return res.status(200).json({
        success: true,
        data: shippingQuotes,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async findById(req: TypedRequest<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;

      const shippingQuote = await ShippingQuoteService.findById(id);

      if (!shippingQuote) {
        return res.status(404).json({
          success: false,
          message: "Shipping quote not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: shippingQuote,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async findByCheckoutSession(
    req: TypedRequest<{ checkoutSessionId: string }>,
    res: Response
  ) {
    try {
      const { checkoutSessionId } = req.params;

      const shippingQuotes =
        await ShippingQuoteService.findByCheckoutSession(checkoutSessionId);

      return res.status(200).json({
        success: true,
        data: shippingQuotes,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async update(
    req: TypedRequest<{ id: string }, typeof updateShippingQuoteSchema._input>,
    res: Response
  ) {
    try {
      const { id } = req.params;

      const validated = updateShippingQuoteSchema.parse(req.body);

      const shippingQuote = await ShippingQuoteService.update(id, validated);

      return res.status(200).json({
        success: true,
        data: shippingQuote,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async delete(
    req: TypedRequest<{ id: string }>,
    res: Response
  ) {
    try {
      const { id } = req.params;

      await ShippingQuoteService.delete(id);

      return res.status(200).json({
        success: true,
        message: "Shipping quote deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}