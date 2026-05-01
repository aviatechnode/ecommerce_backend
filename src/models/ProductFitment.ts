import { prisma } from "../lib/prismadb.js";

export const createFitment = async (productId: string, trimId: string, notes: string) => {
  try {
    const fitment = await prisma.productFitment.create({
      data: {
        productId,
        trimId,
        notes,
      },
    });
    return fitment;
  } catch (error) {
    console.error("Error creating fitment:", error);
    throw new Error("Failed to create fitment");
  }
};

export const getFitmentsByProduct = async (productId: string) => {
  try {
    const fitments = await prisma.productFitment.findMany({
      where: { productId },
      include: {
        product: true,   // Include related product
        trim: true,      // Include related vehicle trim
      },
    });
    return fitments;
  } catch (error) {
    console.error("Error fetching fitments:", error);
    throw new Error("Failed to fetch fitments");
  }
};

export const deleteFitment = async (fitmentId: string) => {
  try {
    const fitment = await prisma.productFitment.delete({
      where: { id: fitmentId },
    });
    return fitment;
  } catch (error) {
    console.error("Error deleting fitment:", error);
    throw new Error("Failed to delete fitment");
  }
};