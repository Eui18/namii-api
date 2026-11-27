import {
  EstablishmentDetailResponse,
  EstablishmentFilterQuery,
  EstablishmentResponse,
  SellerEstablishmentDetailResponse,
  SellerEstablishmentResponse,
  toEstablishmentResponse,
  toSellerEstablishmentResponse,
  UpdateEstablishmentRequest
} from "../dtos/establishmentDto";
import { toBusinessHoursItem } from "../dtos/businessHoursDto";
import { BusinessHours } from "../models/businessHours";
import { ManualStatus } from "../models/establishment";
import { BusinessHoursRepository } from "../repositories/businessHoursRepository";
import { EstablishmentRepository } from "../repositories/establishmentRepository";
import { getMexicoCityDateTime, ScheduleService } from "./scheduleService";
import { AppError } from "../utils/appError";
import {
  readCoordinate,
  readEstablishmentCategory,
  readOptionalText,
  readPhoneNumber,
  readRequiredText
} from "../utils/validators";

export class EstablishmentService {
  constructor(
    private readonly establishmentRepository: EstablishmentRepository,
    private readonly businessHoursRepository: BusinessHoursRepository,
    private readonly scheduleService: ScheduleService
  ) {}

  async create(
    ownerId: number,
    body: Record<string, unknown>
  ): Promise<SellerEstablishmentResponse> {
    const existing = await this.establishmentRepository.findByOwnerId(ownerId);
    if (existing !== null) {
      throw new AppError(409, "El vendedor ya tiene un establecimiento registrado");
    }

    const name = readRequiredText(body.name, "el nombre del establecimiento", 100);
    const category = readEstablishmentCategory(body.category);
    const description = readOptionalText(body.description, "la descripción", 255);
    const phone = readPhoneNumber(body.phone);
    const address = readRequiredText(body.address, "la dirección", 255);
    const latitude = readCoordinate(body.latitude, "la latitud", -90, 90);
    const longitude = readCoordinate(body.longitude, "la longitud", -180, 180);
    const coverPhotoUrl = readOptionalText(body.coverPhotoUrl, "la foto de portada", 500);

    const establishment = await this.establishmentRepository.create({
      ownerId,
      name,
      category,
      description,
      phone,
      address,
      latitude,
      longitude,
      coverPhotoUrl
    });

    const hours = await this.businessHoursRepository.findByEstablishmentId(establishment.id);
    const isOpen = this.scheduleService.isEstablishmentOpen(
      establishment.manualStatus,
      establishment.manualStatusDate,
      hours
    );

    return toSellerEstablishmentResponse(establishment, isOpen);
  }

  async getMyEstablishment(ownerId: number): Promise<SellerEstablishmentDetailResponse> {
    const establishment = await this.establishmentRepository.findByOwnerId(ownerId);
    if (!establishment) {
      throw new AppError(404, "Aún no has registrado tu establecimiento");
    }

    const hours = await this.businessHoursRepository.findByEstablishmentId(establishment.id);
    const isOpen = this.scheduleService.isEstablishmentOpen(
      establishment.manualStatus,
      establishment.manualStatusDate,
      hours
    );

    return {
      ...toSellerEstablishmentResponse(establishment, isOpen),
      businessHours: hours.map(toBusinessHoursItem)
    };
  }

  async updateMyEstablishment(
    ownerId: number,
    body: Record<string, unknown>
  ): Promise<SellerEstablishmentResponse> {
    const establishment = await this.establishmentRepository.findByOwnerId(ownerId);
    if (!establishment) {
      throw new AppError(404, "Aún no has registrado tu establecimiento");
    }

    const updateData: UpdateEstablishmentRequest = {};

    if (body.name !== undefined) {
      updateData.name = readRequiredText(body.name, "el nombre del establecimiento", 100);
    }
    if (body.category !== undefined) {
      updateData.category = readEstablishmentCategory(body.category);
    }
    if (body.description !== undefined) {
      updateData.description = readOptionalText(body.description, "la descripción", 255);
    }
    if (body.phone !== undefined) {
      updateData.phone = readPhoneNumber(body.phone);
    }
    if (body.address !== undefined) {
      updateData.address = readRequiredText(body.address, "la dirección", 255);
    }
    if (body.latitude !== undefined) {
      updateData.latitude = readCoordinate(body.latitude, "la latitud", -90, 90);
    }
    if (body.longitude !== undefined) {
      updateData.longitude = readCoordinate(body.longitude, "la longitud", -180, 180);
    }
    if (body.coverPhotoUrl !== undefined) {
      updateData.coverPhotoUrl = readOptionalText(body.coverPhotoUrl, "la foto de portada", 500);
    }

    const updated = await this.establishmentRepository.update(establishment.id, updateData);
    const hours = await this.businessHoursRepository.findByEstablishmentId(updated.id);
    const isOpen = this.scheduleService.isEstablishmentOpen(
      updated.manualStatus,
      updated.manualStatusDate,
      hours
    );

    return toSellerEstablishmentResponse(updated, isOpen);
  }

  async setManualStatus(
    ownerId: number,
    statusValue: unknown
  ): Promise<{ manualStatus: ManualStatus | null; isOpen: boolean }> {
    if (statusValue === undefined) {
      throw new AppError(400, "Envía manualStatus con OPEN, CLOSED o null");
    }

    if (statusValue !== "OPEN" && statusValue !== "CLOSED" && statusValue !== null) {
      throw new AppError(400, "Envía manualStatus con OPEN, CLOSED o null");
    }

    const establishment = await this.establishmentRepository.findByOwnerId(ownerId);
    if (!establishment) {
      throw new AppError(404, "Aún no has registrado tu establecimiento");
    }

    const manualStatus: ManualStatus | null = statusValue;
    const manualStatusDate: string | null =
      statusValue !== null ? getMexicoCityDateTime().dateString : null;

    await this.establishmentRepository.updateManualStatus(
      establishment.id,
      manualStatus,
      manualStatusDate
    );

    const hours = await this.businessHoursRepository.findByEstablishmentId(establishment.id);
    const isOpen = this.scheduleService.isEstablishmentOpen(
      manualStatus,
      manualStatusDate,
      hours
    );

    return { manualStatus, isOpen };
  }

  async getPublicEstablishments(
    filters: EstablishmentFilterQuery = {}
  ): Promise<EstablishmentResponse[]> {
    const establishments = await this.establishmentRepository.findAll(filters);
    if (establishments.length === 0) {
      return [];
    }

    const ids = establishments.map((e) => e.id);
    const allHours = await this.businessHoursRepository.findByEstablishmentIds(ids);

    const hoursMap = new Map<number, BusinessHours[]>();
    for (const h of allHours) {
      const list = hoursMap.get(h.establishmentId);
      if (list) {
        list.push(h);
      } else {
        hoursMap.set(h.establishmentId, [h]);
      }
    }

    const results: EstablishmentResponse[] = [];
    for (const est of establishments) {
      const hours = hoursMap.get(est.id) ?? [];
      const isOpen = this.scheduleService.isEstablishmentOpen(
        est.manualStatus,
        est.manualStatusDate,
        hours
      );

      results.push(toEstablishmentResponse(est, isOpen));
    }

    return results;
  }

  async getPublicDetail(id: number): Promise<EstablishmentDetailResponse> {
    const establishment = await this.establishmentRepository.findById(id);
    if (!establishment) {
      throw new AppError(404, "Establecimiento no encontrado");
    }

    const hours = await this.businessHoursRepository.findByEstablishmentId(establishment.id);
    const isOpen = this.scheduleService.isEstablishmentOpen(
      establishment.manualStatus,
      establishment.manualStatusDate,
      hours
    );

    return {
      ...toEstablishmentResponse(establishment, isOpen),
      businessHours: hours.map(toBusinessHoursItem)
    };
  }
}