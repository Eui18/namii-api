import { NextFunction, Request, Response } from "express";
import { Role } from "../models/user";
import { AppError } from "../utils/appError";
import { verifyToken } from "../utils/token";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  const match = header?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new AppError(401, "Falta el token de autenticación");
  }

  const data = verifyToken(match[1].trim());

  res.locals.userId = data.userId;
  res.locals.role = data.role;

  next();
}

export function requireRole(role: Role) {
  return (
    _req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (res.locals.role !== role) {
      throw new AppError(
        403,
        "No tienes permiso para realizar esta operación"
      );
    }

    next();
  };
}

export function getUserId(res: Response): number {
  const userId = res.locals.userId;

  if (typeof userId !== "number") {
    throw new AppError(401, "Sesión no válida");
  }

  return userId;
}