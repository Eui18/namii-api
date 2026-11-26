import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/appError";

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const location = `[${req.method} ${req.originalUrl}]`;

  if (error instanceof AppError) {
    console.warn(`${location} ${error.statusCode}: ${error.message}`);

    res.status(error.statusCode).json({
      message: error.message
    });

    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    res.status(400).json({
      message: "El cuerpo de la petición no es un JSON válido"
    });

    return;
  }

  console.error(`${location} Error inesperado:`, error);

  const response: {
    message: string;
    detail?: string;
  } = {
    message: "Error interno del servidor"
  };

  if (env.nodeEnv !== "production") {
    response.detail =
      error instanceof Error ? error.message : String(error);
  }

  res.status(500).json(response);
}