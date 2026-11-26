import { Request, Response } from "express";
import { Role } from "../models/user";
import { AuthService } from "../services/authService";

export function createAuthController(authService: AuthService) {
  function registerAs(role: Role) {
    return async (req: Request, res: Response): Promise<void> => {
      const result = await authService.register(
        role,
        req.body ?? {}
      );

      res.status(201).json(result);
    };
  }

  function loginAs(role: Role) {
    return async (req: Request, res: Response): Promise<void> => {
      const result = await authService.login(
        role,
        req.body ?? {}
      );

      res.status(200).json(result);
    };
  }

  return {
    registerClient: registerAs("CLIENTE"),
    loginClient: loginAs("CLIENTE"),
    registerSeller: registerAs("VENDEDOR"),
    loginSeller: loginAs("VENDEDOR")
  };
}

export type AuthController = ReturnType<
  typeof createAuthController
>;