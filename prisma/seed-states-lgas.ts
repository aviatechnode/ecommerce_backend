import { STATE_LGAS } from "../src/constants/nigeria.js";
import { prisma } from "../src/lib/prismadb.js";

const formatStateName = (key: string) => {
  if (key === "FCT") return "Federal Capital Territory";

  return key
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

// safer LGA normalizer (fixes weird DB mismatches)
const normalizeLga = (name: string) =>
  name
    .replace(/\s+/g, " ")
    .replace(/'/g, "")
    .replace(/\//g, " ")
    .trim();

async function main() {
  console.log("🌱 Seeding states and LGAs...");

  for (const [stateKey, lgas] of Object.entries(STATE_LGAS)) {
    try {
      const stateName = formatStateName(stateKey);

      const state = await prisma.state.upsert({
        where: { name: stateName },
        update: {},
        create: { name: stateName },
      });

      for (const rawLga of lgas) {
        const lgaName = normalizeLga(rawLga);

        await prisma.lGA.upsert({
          where: {
            stateId_name: {
              stateId: state.id,
              name: lgaName,
            },
          },
          update: {},
          create: {
            name: lgaName,
            stateId: state.id,
          },
        });
      }

      console.log(`✓ ${stateName} (${lgas.length} LGAs)`);
    } catch (err) {
      console.error(`❌ Failed state: ${stateKey}`, err);
    }
  }

  console.log("🎉 States and LGAs seeded successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });