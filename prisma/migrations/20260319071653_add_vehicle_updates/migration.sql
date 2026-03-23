-- CreateTable
CREATE TABLE "FitmentIndex" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitmentIndex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FitmentIndex_make_model_year_idx" ON "FitmentIndex"("make", "model", "year");

-- CreateIndex
CREATE INDEX "VehicleEngine_generationId_engineCode_idx" ON "VehicleEngine"("generationId", "engineCode");

-- CreateIndex
CREATE INDEX "VehicleGeneration_modelId_yearStart_yearEnd_idx" ON "VehicleGeneration"("modelId", "yearStart", "yearEnd");

-- CreateIndex
CREATE INDEX "VehicleModel_makeId_name_idx" ON "VehicleModel"("makeId", "name");

-- CreateIndex
CREATE INDEX "VehicleTrim_engineId_name_idx" ON "VehicleTrim"("engineId", "name");
