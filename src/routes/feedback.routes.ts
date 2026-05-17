import { Router } from "express";
import { FeedbackController } from "../controllers/feedback.controller.js";

const router = Router();
const controller = new FeedbackController();

router.post("/", controller.createFeedback);

export default router;