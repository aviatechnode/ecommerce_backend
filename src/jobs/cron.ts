import cron from "node-cron";
import { generateDashboardSnapshot } from "./dashboard.snapshot.js";

// every day at 12:05 AM
cron.schedule("5 0 * * *", async () => {
  console.log("Running snapshot job...");
  await generateDashboardSnapshot();
});