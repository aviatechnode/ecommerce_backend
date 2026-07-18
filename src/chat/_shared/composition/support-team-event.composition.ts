import { PrismaSupportTeamEventGateway } from "../../gateways/prisma-support-team-event.gateway.js";
import { SupportTeamEventService } from "../../services/support-event-team.service.js";
import { SupportTeamEventPolicy } from "../../policies/support-team-event-policy.js";
import { SupportTeamEventController } from "../../../controllers/chat/support-team-event.controller.js";
import { createSupportTeamEventRoutes } from "../../../routes/chat/support-team-event.routes.js";
import { prisma } from "../../../lib/prismadb.js";

const gateway = new PrismaSupportTeamEventGateway(
    prisma,
  );

const policy = new SupportTeamEventPolicy();

const service = new SupportTeamEventService(
    gateway,
    policy,
  );

const controller = new SupportTeamEventController(
    service,
  );

export const supportTeamEventRoutes = createSupportTeamEventRoutes(
    controller,
  );