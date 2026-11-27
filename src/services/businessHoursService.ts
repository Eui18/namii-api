import {
  BusinessHoursItemResponse,
  toBusinessHoursItem
} from "../dtos/businessHoursDto";
import { BusinessHours } from "../models/businessHours";
import { BusinessHoursRepository } from "../repositories/businessHoursRepository";
import { EstablishmentRepository } from "../repositories/establishmentRepository";
import { AppError } from "../utils/appError";
import { readDayOfWeek, readTime } from "../utils/validators";

export class BusinessHoursService {
  constructor(
    private readonly businessHoursRepository: BusinessHoursRepository,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async getByEstablishmentId(establishmentId: number): Promise<BusinessHoursItemResponse[]> {
    const establishment = await this.establishmentRepository.findById(establishmentId);

    if (!establishment) {
      throw new AppError(404, "Establecimiento no encontrado");
    }

    const hours = await this.businessHoursRepository.findByEstablishmentId(establishmentId);
    return hours.map(toBusinessHoursItem);
  }

  async setMyEstablishmentHours(
    ownerId: number,
    hoursInput: unknown
  ): Promise<BusinessHoursItemResponse[]> {
    const establishment = await this.establishmentRepository.findByOwnerId(ownerId);

    if (!establishment) {
      throw new AppError(404, "Aún no has registrado tu establecimiento");
    }

    if (!Array.isArray(hoursInput)) {
      throw new AppError(400, "Debes enviar un arreglo con los horarios de los 7 días");
    }

    if (hoursInput.length !== 7) {
      throw new AppError(400, "Debes configurar exactamente los 7 días de la semana");
    }

    const processedDays = new Set<number>();
    const hoursToSave: BusinessHours[] = [];

    for (const item of hoursInput) {
      if (typeof item !== "object" || item === null) {
        throw new AppError(400, "Formato de horario no válido");
      }

      const raw = item as Record<string, unknown>;
      const dayOfWeek = readDayOfWeek(raw.dayOfWeek);

      if (processedDays.has(dayOfWeek)) {
        throw new AppError(400, "El día " + dayOfWeek + " está duplicado en la solicitud");
      }
      processedDays.add(dayOfWeek);

      if (typeof raw.isClosed !== "boolean") {
        throw new AppError(400, "El campo isClosed debe ser un booleano");
      }

      if (raw.isClosed) {
        hoursToSave.push({
          establishmentId: establishment.id,
          dayOfWeek,
          opensAt: null,
          closesAt: null,
          isClosed: true
        });
        continue;
      }

      const opensAt = readTime(raw.opensAt, "apertura del día " + dayOfWeek);
      const closesAt = readTime(raw.closesAt, "cierre del día " + dayOfWeek);

      if (opensAt === closesAt) {
        throw new AppError(
          400,
          "La hora de apertura y cierre no pueden ser idénticas en el día " + dayOfWeek
        );
      }

      hoursToSave.push({
        establishmentId: establishment.id,
        dayOfWeek,
        opensAt,
        closesAt,
        isClosed: false
      });
    }

    const saved = await this.businessHoursRepository.saveAll(establishment.id, hoursToSave);
    return saved.map(toBusinessHoursItem);
  }
}