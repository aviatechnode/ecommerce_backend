import { z } from "zod";

//////////////////////////////////////////////////////////
// RAW SCHEMA (for parsing)
//////////////////////////////////////////////////////////
export const fitmentSearchSchemaRaw = z.object({
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() !== "") {
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      }
      return val;
    },
    z.number().int().optional()
  ),
});

//////////////////////////////////////////////////////////
// CLEANED TYPE (removes undefined keys)
//////////////////////////////////////////////////////////
export const fitmentSearchSchema = fitmentSearchSchemaRaw.transform(
  (data) =>
    Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    )
);

//////////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////////
export type FitmentSearchInput = Partial<{
  make: string;
  model: string;
  year: number;
}>;