import { Router } from "express";
import { BusinessHoursController } from "../controllers/businessHoursController";
import { EstablishmentController } from "../controllers/establishmentController";
import { authenticate, requireRole } from "../middlewares/authMiddleware";

export function createEstablishmentRoutes(
  establishmentController: EstablishmentController,
  businessHoursController: BusinessHoursController
): Router {
  const router = Router();

  router.post(
    "/",
    authenticate,
    requireRole("VENDEDOR"),
    establishmentController.create
  );

  router.get(
    "/my-establishment",
    authenticate,
    requireRole("VENDEDOR"),
    establishmentController.getMyEstablishment
  );

  router.put(
    "/my-establishment",
    authenticate,
    requireRole("VENDEDOR"),
    establishmentController.updateMyEstablishment
  );

  router.patch(
    "/my-establishment/status",
    authenticate,
    requireRole("VENDEDOR"),
    establishmentController.setManualStatus
  );

  router.put(
    "/my-establishment/hours",
    authenticate,
    requireRole("VENDEDOR"),
    businessHoursController.setMyEstablishmentHours
  );

  router.get("/", establishmentController.getPublicEstablishments);

  router.get("/:id/business-hours", businessHoursController.getByEstablishmentId);

  router.get("/:id", establishmentController.getPublicDetail);

  return router;
}