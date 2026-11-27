import express, { NextFunction, Request, Response } from "express";
import { createAppContainer } from "./container/appContainer";
import { errorHandler } from "./middlewares/errorHandler";
import { createAuthRoutes } from "./routes/authRoutes";
import { createEstablishmentRoutes } from "./routes/establishmentRoutes";
import { AppError } from "./utils/appError";

export function createApp() {
  const app = express();
  const container = createAppContainer();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "50kb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/auth", createAuthRoutes(container.authController));
  app.use(
    "/api/establishments",
    createEstablishmentRoutes(
      container.establishmentController,
      container.businessHoursController
    )
  );

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(404, "Ruta no encontrada"));
  });

  app.use(errorHandler);

  return app;
}

export default createApp();