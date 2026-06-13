// VEHICLE DOMAIN
import type { ProductFitment } from "./fitment.types.js";

export interface VehicleMake {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  models: VehicleModel[];
  createdAt: Date;
  updatedAt: Date;
  productFitments: ProductFitment[];
}

export interface VehicleModel {
  id: string;
  makeId: string;
  name: string;
  slug: string;
  isActive: boolean;
  make: VehicleMake;
  generations: VehicleGeneration[];
  createdAt: Date;
  updatedAt: Date;
  productFitments: ProductFitment[];
}

export interface VehicleGeneration {
  id: string;
  modelId: string;
  name: string;
  slug?: string;
  chassisCode?: string;
  yearStart: number;
  yearEnd?: number;
  isActive: boolean;
  model: VehicleModel;
  engines: VehicleEngine[];
  createdAt: Date;
  updatedAt: Date;
  productFitments: ProductFitment[];
}

export interface VehicleEngine {
  id: string;
  generationId: string;
  engineCode: string;
  engineName?: string;
  fuelType?: string;
  aspiration?: string;
  cylinders?: number;
  horsepower?: number;
  displacementCc?: number;
  displacementLabel?: string;
  drivetrain?: string;
  transmissionType?: string;
  isActive: boolean;
  generation: VehicleGeneration;
  trims: VehicleTrim[];
  createdAt: Date;
  updatedAt: Date;
  productFitments: ProductFitment[];
}

export interface VehicleTrim {
  id: string;
  engineId: string;
  name: string;
  bodyType?: string;
  doors?: number;
  isActive: boolean;
  engine: VehicleEngine;
  productFitments: ProductFitment[];
  createdAt: Date;
  updatedAt: Date;
}