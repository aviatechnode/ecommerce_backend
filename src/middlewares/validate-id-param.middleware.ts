import type { Request, Response, NextFunction } from "express";
import z from "zod";


/* =========================================================
PARAM SCHEMA
========================================================= */

const idParamSchema = z.object({
  id: z.string().uuid({
    message: "Invalid UUID format for address ID",
  }),
});

type IdParam = z.infer<typeof idParamSchema>;

/* =========================================================
MIDDLEWARE
========================================================= */

export const validateIdParam = (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  const result = idParamSchema.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid address ID",
      errors: result.error.flatten(),
    });
  }

  // optional: attach validated params (clean pattern for scaling)
  req.params = result.data as IdParam;

  next();
};