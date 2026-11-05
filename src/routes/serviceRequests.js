import { Router } from "express";

export function createServiceRequestRouter(controller) {
  const router = Router();

  router.get(
    "/service-requests",
    controller.showServiceRequests
  );

  router.get(
    "/service-requests/new",
    controller.showSubmissionForm
  );

  router.post(
    "/service-requests",
    controller.submitServiceRequest
  );

  router.get(
    "/service-requests/:id",
    controller.showServiceRequest
  );

  router.post(
    "/service-requests/:id/start",
    controller.startProcessing
  );

  router.post(
    "/service-requests/:id/complete",
    controller.completeServiceRequest
  );

  router.post(
    "/service-requests/:id/cancel",
    controller.cancelServiceRequest
  );

  return router;
}