
import { Router } from "express";

export function createResidentRouter(controller) {
  const router = Router();

  router.get("/residents", controller.showResidents);

  router.get(
    "/residents/new",
    controller.showRegistrationForm
  );

  router.post(
    "/residents",
    controller.registerResident
  );

  router.get(
    "/residents/:id/edit",
    controller.showEditForm
  );

  router.post(
    "/residents/:id/edit",
    controller.updateResident
  );

  router.post(
    "/residents/:id/deactivate",
    controller.deactivateResident
  );

  return router;
}
