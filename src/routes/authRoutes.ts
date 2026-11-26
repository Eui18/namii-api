import { Router } from "express";
import { AuthController } from "../controllers/authController";

export function createAuthRoutes(
  controller: AuthController
): Router {
  const router = Router();

  router.post("/client/register", controller.registerClient);
  router.post("/client/login", controller.loginClient);

  router.post("/seller/register", controller.registerSeller);
  router.post("/seller/login", controller.loginSeller);

  return router;
}
