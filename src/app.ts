import express, { NextFunction, Request, Response } from "express";
import { createAppContainer } from "./container/appContainer";
import { errorHandler } from "./middlewares/errorHandler";
import { createAuthRoutes } from "./routes/authRoutes";
import { AppError } from "./utils/appError";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Ñamii API funcionando"
  });
});

const container = createAppContainer();

app.use(
  "/api/auth",
  createAuthRoutes(container.authController)
);

app.use(
  (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(404, "Ruta no encontrada"));
  }
);

app.use(errorHandler);

export default app;