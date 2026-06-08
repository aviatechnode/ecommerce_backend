import { prisma } from "../src/lib/prismadb.js"

/* =========================================================
   SHIPPING ZONE DEFINITIONS (NIGERIA)
========================================================= */

const shippingZones = [
  {
    name: "Lagos Metro",
    states: ["Lagos"]
  },

  {
    name: "Federal Capital Territory",
    states: ["FCT"]
  },

  {
    name: "South West",
    states: [
      "Ogun",
      "Oyo",
      "Osun",
      "Ondo",
      "Ekiti"
    ]
  },

  {
    name: "South East",
    states: [
      "Abia",
      "Anambra",
      "Ebonyi",
      "Enugu",
      "Imo"
    ]
  },

  {
    name: "South South",
    states: [
      "Akwa Ibom",
      "Bayelsa",
      "Cross River",
      "Delta",
      "Edo",
      "Rivers"
    ]
  },

  {
    name: "North Central",
    states: [
      "Benue",
      "Kogi",
      "Kwara",
      "Nasarawa",
      "Niger",
      "Plateau"
    ]
  },

  {
    name: "North West",
    states: [
      "Jigawa",
      "Kaduna",
      "Kano",
      "Katsina",
      "Kebbi",
      "Sokoto",
      "Zamfara"
    ]
  },

  {
    name: "North East",
    states: [
      "Adamawa",
      "Bauchi",
      "Borno",
      "Gombe",
      "Taraba",
      "Yobe"
    ]
  }
] as const

/* =========================================================
   MAIN SEED
========================================================= */

async function main() {
  console.log("🌍 Shipping Zones Seeding Started...\n")

  for (const zone of shippingZones) {

    const states = await prisma.state.findMany({
      where: {
        name: {
          in: [...zone.states]
        }
      }
    })

    const created = await prisma.shippingZone.upsert({
      where: {
        name: zone.name
      },
      update: {
        states: {
          set: [],
          connect: states.map(s => ({ id: s.id }))
        }
      },
      create: {
        name: zone.name,
        states: {
          connect: states.map(s => ({ id: s.id }))
        }
      }
    })

    console.log(`✅ Seeded zone: ${created.name}`)
  }

  console.log("\n🎉 Shipping Zones Seed Completed!")
}

main()
  .catch((e) => {
    console.error("❌ Shipping seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })