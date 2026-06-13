// FITMENT SYSTEM CORE
import type { Product } from "@prisma/client";
import type {
  VehicleEngine,
  VehicleGeneration,
  VehicleMake,
  VehicleModel,
  VehicleTrim
} from "./vehicle.types.js";

export type FitmentType =
  | 'UNIVERSAL'
  | 'EXACT'
  | 'RANGE'
  | 'ENGINE_SPECIFIC'
  | 'TRIM_SPECIFIC'
  | 'OEM_MATCH'
  | 'CROSS_REFERENCE'
  | 'GENERATION_ONLY';

export type FitmentLevel =
  | 'GLOBAL'
  | 'MAKE'
  | 'MODEL'
  | 'GENERATION'
  | 'ENGINE'
  | 'TRIM'
  | 'EXACT_MATCH';

export interface FitmentServiceConfig {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  allowUniversalFallback: boolean;
  allowCrossGenerationMatch: boolean;
  allowEngineFallback: boolean;
  weightMake: number;
  weightModel: number;
  weightGeneration: number;
  weightEngine: number;
  weightTrim: number;
  weightYear: number;
  enableFitmentIndexing: boolean;
  enableTextSearchFallback: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FitmentTypeRule {
  id: string;
  type: FitmentType;
  level: FitmentLevel;
  requiresMake: boolean;
  requiresModel: boolean;
  requiresGeneration: boolean;
  requiresEngine: boolean;
  requiresTrim: boolean;
  requiresYear: boolean;
  allowYearRange: boolean;
  strictMatching: boolean;
  priority: number;
  createdAt: Date;
}

export interface FitmentResolutionLog {
  id: string;
  productId: string;
  inputMake?: string;
  inputModel?: string;
  inputGeneration?: string;
  inputEngine?: string;
  inputTrim?: string;
  inputYear?: number;
  matched: boolean;
  matchedLevel?: FitmentLevel;
  matchedType?: FitmentType;
  score?: number;
  resolutionPath?: string;
  notes?: string;
  createdAt: Date;
  product: Product;
}

//////////////////////////////////////////////////////////
// FITMENT INDEX
//////////////////////////////////////////////////////////

export interface FitmentIndex {
  id: string;
  productId: string;
  makeId: string;
  make: string;
  modelId: string;
  model: string;
  generationId?: string;
  generation?: string;
  engineId?: string;
  engineCode?: string;
  trimId?: string;
  trim?: string;
  year: number;
  searchableText?: string;
  createdAt: Date;
  product: Product;
}

//////////////////////////////////////////////////////////
// PRODUCT FITMENT (EXTENDED)
//////////////////////////////////////////////////////////

export interface ProductFitment {
  id: string;
  productId: string;
  level: FitmentLevel;
  type: FitmentType;
  makeId?: string;
  modelId?: string;
  generationId?: string;
  engineId?: string;
  trimId?: string;
  yearStart?: number;
  yearEnd?: number;
  notes?: string;
  position?: string;
  quantityRequired?: number;
  isUniversal: boolean;
  isVerified: boolean;
  confidenceScore?: number;
  createdAt: Date;
  updatedAt: Date;
  product: Product;
  make?: VehicleMake;
  model?: VehicleModel;
  generation?: VehicleGeneration;
  engine?: VehicleEngine;
  trim?: VehicleTrim;
}