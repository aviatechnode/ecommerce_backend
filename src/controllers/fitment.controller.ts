import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prismadb.js";
import { FitmentService } from "../services/fitment.service.js";
import { getParam } from "../utils/getParam.js";

const fitmentService = new FitmentService(prisma);

export class FitmentController {
  // =========================
  // CONFIG
  // =========================

  static async getConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.getServiceConfig();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.updateServiceConfig(req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // =========================
  // FITMENT RULES
  // =========================

  static async getRules(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.getFitmentTypeRules();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createRule(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.createFitmentTypeRule(req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRule(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = getParam(req, "id");

      const result = await fitmentService.updateFitmentTypeRule(
        id,
        req.body
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRule(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = getParam(req, "id");

      const result = await fitmentService.deleteFitmentTypeRule(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // =========================
  // OEM REFERENCES
  // =========================

  static async getOEMReferences(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.getOEMReferences();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createOEMReference(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.createOEMReference(req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOEMReference(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = getParam(req, "id");

      const result = await fitmentService.updateOEMReference(
        id,
        req.body
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteOEMReference(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = getParam(req, "id");

      const result = await fitmentService.deleteOEMReference(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // =========================
  // CROSS REFERENCES
  // =========================

  static async getCrossReferences(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.getCrossReferences();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCrossReference(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.createCrossReference(
        req.body
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCrossReference(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = getParam(req, "id");

      const result = await fitmentService.updateCrossReference(
        id,
        req.body
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCrossReference(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = getParam(req, "id");

      const result = await fitmentService.deleteCrossReference(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // =========================
  // PRODUCT FITMENTS
  // =========================

  static async getFitments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.getProductFitments(
        req.query as any
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createFitment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.createProductFitment(
        req.body
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateFitment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = getParam(req, "id");

      const result = await fitmentService.updateProductFitment(
        id,
        req.body
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteFitment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = getParam(req, "id");

      const result = await fitmentService.deleteProductFitment(id);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // =========================
  // FITMENT RESOLUTION
  // =========================

  static async resolveFitment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.resolveFitment(req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rebuildIndex(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await fitmentService.rebuildFullFitmentIndex();

      res.json({
        success: true,
        message: "Fitment index rebuilt",
      });
    } catch (error) {
      next(error);
    }
  }

  static async logs(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fitmentService.getResolutionLogs(
        typeof req.query.productId === "string"
          ? req.query.productId
          : undefined
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}