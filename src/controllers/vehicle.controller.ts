import type { Request, Response } from "express";
import { VehicleService } from "../services/vehicle.service.js";
import { getParam } from "../utils/getParam.js";

export class VehicleController {
  //////////////////////////////////////////////////////////
  // MAKES
  //////////////////////////////////////////////////////////

  static async createMake(req: Request, res: Response) {
    const data = await VehicleService.createMake(req.body);

    return res.status(201).json(data);
  }

  static async findMakes(req: Request, res: Response) {
    const data = await VehicleService.findMakes(req.query);

    return res.json(data);
  }

  static async findMakeById(
    req: Request,
    res: Response
  ) {

    const id = getParam(req, "id");
    const data = await VehicleService.findMakeById(id);

    return res.json(data);
  }

  static async updateMake(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id");
    const data = await VehicleService.updateMake(id, req.body);

    return res.json(data);
  }

  static async deleteMake(
    req: Request,
    res: Response
  ) {

    const id = getParam(req, "id");
    const data = await VehicleService.deleteMake(id);

    return res.json(data);
  }

  //////////////////////////////////////////////////////////
  // MODELS
  //////////////////////////////////////////////////////////

  static async createModel(
    req: Request,
    res: Response
  ) {
    const data = await VehicleService.createModel(
      req.body
    );

    return res.status(201).json(data);
  }

  static async findModels(
    req: Request,
    res: Response
  ) {
    const data = await VehicleService.findModels(
      req.query
    );

    return res.json(data);
  }

  static async findModelById(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id")
    const data = await VehicleService.findModelById(id);

    return res.json(data);
  }

  static async updateModel(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id")
    const data = await VehicleService.updateModel(id, req.body);

    return res.json(data);
  }

  static async deleteModel(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id")
    const data = await VehicleService.deleteModel(id);

    return res.json(data);
  }

  //////////////////////////////////////////////////////////
  // GENERATIONS
  //////////////////////////////////////////////////////////

  static async createGeneration(
    req: Request,
    res: Response
  ) {
    const data =
      await VehicleService.createGeneration(
        req.body
      );

    return res.status(201).json(data);
  }

  static async findGenerations(
    req: Request,
    res: Response
  ) {
    const data =
      await VehicleService.findGenerations(
        req.query
      );

    return res.json(data);
  }

  static async findGenerationById(
    req: Request,
    res: Response
  ) {

    const id = getParam(req, "id")
    const data =
      await VehicleService.findGenerationById(id);
    return res.json(data);
  }

  static async updateGeneration(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id");
    const data =
      await VehicleService.updateGeneration(id, req.body);

    return res.json(data);
  }

  static async deleteGeneration(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id");
    const data =
      await VehicleService.deleteGeneration(id);

    return res.json(data);
  }

  //////////////////////////////////////////////////////////
  // ENGINES
  //////////////////////////////////////////////////////////

  static async createEngine(
    req: Request,
    res: Response
  ) {
    const data =
      await VehicleService.createEngine(
        req.body
      );

    return res.status(201).json(data);
  }

  static async findEngines(
    req: Request,
    res: Response
  ) {
    const data =
      await VehicleService.findEngines(
        req.query
      );

    return res.json(data);
  }

  static async findEngineById(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id");
    const data =
      await VehicleService.findEngineById(id);

    return res.json(data);
  }

  static async updateEngine(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id");
    const data =
      await VehicleService.updateEngine(id, req.body);

    return res.json(data);
  }

  static async deleteEngine(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id");
    const data =
      await VehicleService.deleteEngine(id);

    return res.json(data);
  }

  //////////////////////////////////////////////////////////
  // TRIMS
  //////////////////////////////////////////////////////////

  static async createTrim(
    req: Request,
    res: Response
  ) {
    const data =
      await VehicleService.createTrim(
        req.body
      );

    return res.status(201).json(data);
  }

  static async findTrims(
    req: Request,
    res: Response
  ) {
    const data =
      await VehicleService.findTrims(
        req.query
      );

    return res.json(data);
  }

  static async findTrimById(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id");
    const data =
      await VehicleService.findTrimById(id);

    return res.json(data);
  }

  static async updateTrim(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id");
    const data =
      await VehicleService.updateTrim(id, req.body);

    return res.json(data);
  }

  static async deleteTrim(
    req: Request,
    res: Response
  ) {
    const id = getParam(req, "id");
    const data =
      await VehicleService.deleteTrim(id);

    return res.json(data);
  }
}