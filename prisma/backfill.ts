// import { prisma } from "../src/lib/prismadb.js";
// import { randomBytes, createHash } from "crypto";

// async function backfill() {
//   const tokens = await prisma.refreshToken.findMany();

//   for (const t of tokens) {
//     const fakeToken = randomBytes(32).toString("hex");

//     const hash = createHash("sha256")
//       .update(fakeToken)
//       .digest("hex");

//     await prisma.refreshToken.update({
//       where: { id: t.id },
//       data: { csrfHash: hash },
//     });
//   }

//   console.log("Backfill complete");
// }

// backfill();