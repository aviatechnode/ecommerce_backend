// // services/shipment/shipping-checkout.service.ts

// import { prisma } from "../../lib/prismadb.js";
// import { Prisma } from "@prisma/client";
// import { ShipmentService } from "./shipment.service.js";

// export class ShippingCheckoutService {
//   static async resolveShipping(params: {
//     shippingMethod: ShippingMethod;
//     pickupStationId?: string | null;
//     deliveryStateId: string;
//     deliveryLgaId: string;
//     totalWeight: number;
//     orderId: string;
//   }) {
//     const {
//       shippingMethod,
//       pickupStationId,
//       deliveryStateId,
//       deliveryLgaId,
//       totalWeight,
//       orderId,
//     } = params;

//     ////////////////////////////////////////////////////////
//     // PICKUP STATION
//     ////////////////////////////////////////////////////////

//     if (shippingMethod ===ShippingMethod.PICKUP_STATION) {
//       if (!pickupStationId) {
//         throw new Error(
//           "pickupStationId required"
//         );
//       }

//       const station = await PickupStationService.findById(
//           pickupStationId
//         );

//       if (!station.isActive) {
//         throw new Error(
//           "Pickup station inactive"
//         );
//       }

//       const shipment =
//         await ShipmentService.createShipment({
//           orderId,

//           courierId:
//             station.courierId,

//           pickupStationId:
//             station.id,

//           shippingRateId: null,

//           shippingMethod,

//           trackingNumber:
//             `TRK-${Date.now()}`,

//           status:
//             ShipmentStatus.PENDING,

//           deliveryFee: 0,

//           supportsCOD: false,

//           weight: totalWeight,

//           estimatedDays: 0,
//         });

//       return {
//         deliveryFee:
//           new Prisma.Decimal(0),

//         shipment,
//       };
//     }

//     ////////////////////////////////////////////////////////
//     // ZONE RESOLUTION
//     ////////////////////////////////////////////////////////

//     const zoneLga =
//       await prisma.shippingZoneLGA.findFirst({
//         where: {
//           lgaId: deliveryLgaId,
//         },
//         include: {
//           zone: true,
//         },
//       });

//     const zoneState =
//       await prisma.shippingZoneState.findFirst({
//         where: {
//           stateId: deliveryStateId,
//         },
//         include: {
//           zone: true,
//         },
//       });

//     const zone =
//       zoneLga?.zone ??
//       zoneState?.zone;

//     if (!zone) {
//       throw new Error(
//         "No shipping zone found"
//       );
//     }

//     ////////////////////////////////////////////////////////
//     // ACTIVE COURIER
//     ////////////////////////////////////////////////////////

//     const courier =
//       await prisma.courier.findFirst({
//         where: {
//           isActive: true,
//         },
//       });

//     if (!courier) {
//       throw new Error(
//         "No active courier"
//       );
//     }

//     ////////////////////////////////////////////////////////
//     // SHIPPING RATE
//     ////////////////////////////////////////////////////////

//     const rate =
//       await prisma.shippingRate.findFirst({
//         where: {
//           courierId: courier.id,

//           zoneId: zone.id,

//           isActive: true,

//           minWeight: {
//             lte: totalWeight,
//           },

//           maxWeight: {
//             gte: totalWeight,
//           },
//         },
//       });

//     if (!rate) {
//       throw new Error(
//         "No shipping rate found"
//       );
//     }

//     let deliveryFee =
//       new Prisma.Decimal(
//         rate.baseFee
//       );

//     if (rate.perKgFee) {
//       deliveryFee = deliveryFee.add(
//         new Prisma.Decimal(
//           rate.perKgFee
//         ).mul(totalWeight)
//       );
//     }

//     if (rate.fixedFee) {
//       deliveryFee = deliveryFee.add(
//         new Prisma.Decimal(
//           rate.fixedFee
//         )
//       );
//     }

//     const shipment = await ShipmentService.createShipment({
//         orderId,

//         courierId: courier.id,

//         shippingRateId: rate.id,

//         shippingMethod,

//         trackingNumber:
//           `TRK-${Date.now()}`,

//         status: ShipmentStatus.PENDING,

//         deliveryFee:
//           deliveryFee.toNumber(),

//         supportsCOD: false,

//         weight: totalWeight,

//         chargeableWeight:
//           totalWeight,

//         estimatedDays:
//           rate.estimatedDaysMin,
//       });

//     return {
//       deliveryFee,
//       shipment,
//     };
//   }
// }