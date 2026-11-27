import express, { NextFunction, Request, Response } from "express";
import { createAppContainer } from "./container/appContainer";
import { errorHandler } from "./middlewares/errorHandler";
import { createAuthRoutes } from "./routes/authRoutes";
import { AppError } from "./utils/appError";

export function createApp() {
  const app = express();
  const container = createAppContainer();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      message: "Ñamii API funcionando"
    });
  });

  app.use("/api/auth", createAuthRoutes(container.authController));

  app.use(
    (_req: Request, _res: Response, next: NextFunction) => {
      next(new AppError(404, "Ruta no encontrada"));
    }
  );

  app.use(errorHandler);

  return app;
}

export default createApp();