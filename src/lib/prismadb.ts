import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auditExtension } from "./prisma.audit.extension.js";

/* =========================================================
ADAPTER
========================================================= */

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL?.trim(),
});

/* =========================================================
GLOBAL PRISMA CACHE
========================================================= */

declare global {
  var prisma: PrismaClient | undefined;
}

const baseClient =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = baseClient;
}

/* =========================================================
NORMALIZER
========================================================= */

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const normalizeAddressPayload = (data: any) => {
  if (!data) return data;

  return {
    ...data,

    name: data.name ? titleCase(data.name) : data.name,
    city: data.city ? titleCase(data.city) : data.city,
    street: data.street ? titleCase(data.street) : data.street,
    lga: data.lga ? titleCase(data.lga) : data.lga,

    area: data.area ? titleCase(data.area) : null,
    landmark: data.landmark ? titleCase(data.landmark) : null,
  };
};

/* =========================================================
EXTEND PRISMA (AUDIT + NORMALIZATION)
========================================================= */

export const prisma = baseClient.$extends({
  ...auditExtension,

  query: {
    address: {
      async create({ args, query }) {
        args.data = normalizeAddressPayload(args.data);
        return query(args);
      },

      async update({ args, query }) {
        args.data = normalizeAddressPayload(args.data);
        return query(args);
      },

      async updateMany({ args, query }) {
        args.data = normalizeAddressPayload(args.data);
        return query(args);
      },
    },
  },
});

export type PrismaInstance = typeof prisma;

export type PrismaTransaction = Parameters<Parameters<PrismaInstance["$transaction"]>[0]>[0];