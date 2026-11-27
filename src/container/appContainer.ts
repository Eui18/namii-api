import { pool } from "../config/database";
import { UserRepositoryImpl } from "../repositories/userRepositoryImpl";
import { EstablishmentRepositoryImpl } from "../repositories/establishmentRepositoryImpl";
import { BusinessHoursRepositoryImpl } from "../repositories/businessHoursRepositoryImpl";
import { ScheduleService } from "../services/scheduleService";
import { AuthService } from "../services/authService";
import { EstablishmentService } from "../services/establishmentService";
import { BusinessHoursService } from "../services/businessHoursService";
import { createAuthController } from "../controllers/authController";
import { createEstablishmentController } from "../controllers/establishmentController";
import { createBusinessHoursController } from "../controllers/businessHoursController";

export function createAppContainer() {
  const userRepository = new UserRepositoryImpl(pool);
  const establishmentRepository = new EstablishmentRepositoryImpl(pool);
  const businessHoursRepository = new BusinessHoursRepositoryImpl(pool);

  const scheduleService = new ScheduleService();

  const authService = new AuthService(userRepository);
  const establishmentService = new EstablishmentService(
    establishmentRepository,
    businessHoursRepository,
    scheduleService
  );
  const businessHoursService = new BusinessHoursService(
    businessHoursRepository,
    establishmentRepository
  );

  const authController = createAuthController(authService);
  const establishmentController = createEstablishmentController(establishmentService);
  const businessHoursController = createBusinessHoursController(businessHoursService);

  return {
    authController,
    establishmentController,
    businessHoursController
  };
}

export type AppContainer = ReturnType<typeof createAppContainer>;