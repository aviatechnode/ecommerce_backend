import { Prisma } from "@prisma/client";

export async function calculateDistanceKm(
  origin: string,
  destination: string
): Promise<number> {
  const apiKey = process.env.GOOGLE_MAPS_KEY;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`
  );

  const data = await response.json();
  const meters = data.rows[0].elements[0].distance.value;

  return meters / 1000;
}