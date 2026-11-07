import { Router } from "express";

export function createDashboardRouter(controller) {
  const router = Router();

  router.get(
    "/dashboard",
    controller.showDashboard
  );

  return router;
}