import { pool } from "../config/database";
import { createAuthController } from "../controllers/authController";
import { UserRepositoryImpl } from "../repositories/userRepositoryImpl";
import { AuthService } from "../services/authService";

export function createAppContainer() {
  const userRepository = new UserRepositoryImpl(pool);
  const authService = new AuthService(userRepository);
  const authController = createAuthController(authService);

  return {
    authController
  };
}
