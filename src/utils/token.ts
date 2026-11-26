import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "../models/user";
import { AppError } from "./appError";

export interface TokenData {
  userId: number;
  role: Role;
}

export function generateToken(
  userId: number,
  role: Role
): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  };

  return jwt.sign(
    { userId, role },
    env.jwtSecret,
    options
  );
}

export function verifyToken(token: string): TokenData {
  let payload: string | JwtPayload;

  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError(401, "Token inválido o expirado");
  }

  if (
    typeof payload === "string" ||
    typeof payload.userId !== "number" ||
    (payload.role !== "CLIENTE" && payload.role !== "VENDEDOR")
  ) {
    throw new AppError(401, "Token inválido");
  }

  return {
    userId: payload.userId,
    role: payload.role
  };
}