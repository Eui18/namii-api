import { Request, Response } from "express";
import { getUserId } from "../middlewares/authMiddleware";
import { BusinessHoursService } from "../services/businessHoursService";
import { readPositiveInteger } from "../utils/validators";

export function createBusinessHoursController(
  businessHoursService: BusinessHoursService
) {
  async function getByEstablishmentId(req: Request, res: Response): Promise<void> {
    const id = readPositiveInteger(req.params.id, "El identificador del establecimiento");
    const hours = await businessHoursService.getByEstablishmentId(id);
    res.status(200).json(hours);
  }

  async function setMyEstablishmentHours(req: Request, res: Response): Promise<void> {
    const ownerId = getUserId(res);
    const bodyHours = req.body?.hours !== undefined ? req.body.hours : req.body;
    const hours = await businessHoursService.setMyEstablishmentHours(ownerId, bodyHours);
    res.status(200).json(hours);
  }

  return {
    getByEstablishmentId,
    setMyEstablishmentHours
  };
}

export type BusinessHoursController = ReturnType<typeof createBusinessHoursController>;