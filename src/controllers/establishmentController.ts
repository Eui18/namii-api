import { Request, Response } from "express";
import { EstablishmentFilterQuery } from "../dtos/establishmentDto";
import { getUserId } from "../middlewares/authMiddleware";
import { EstablishmentService } from "../services/establishmentService";
import {
  readEstablishmentCategory,
  readMapBounds,
  readPositiveInteger
} from "../utils/validators";

export function createEstablishmentController(
  establishmentService: EstablishmentService
) {
  async function create(req: Request, res: Response): Promise<void> {
    const ownerId = getUserId(res);
    const created = await establishmentService.create(ownerId, req.body ?? {});
    res.status(201).json(created);
  }

  async function getMyEstablishment(_req: Request, res: Response): Promise<void> {
    const ownerId = getUserId(res);
    const establishment = await establishmentService.getMyEstablishment(ownerId);
    res.status(200).json(establishment);
  }

  async function updateMyEstablishment(req: Request, res: Response): Promise<void> {
    const ownerId = getUserId(res);
    const updated = await establishmentService.updateMyEstablishment(ownerId, req.body ?? {});
    res.status(200).json(updated);
  }

  async function setManualStatus(req: Request, res: Response): Promise<void> {
    const ownerId = getUserId(res);
    const statusValue = req.body !== undefined ? req.body.manualStatus : undefined;
    const result = await establishmentService.setManualStatus(ownerId, statusValue);
    res.status(200).json(result);
  }

  async function getPublicEstablishments(req: Request, res: Response): Promise<void> {
    const query = req.query ?? {};
    const filters: EstablishmentFilterQuery = {};

    if (typeof query.category === "string" && query.category.trim() !== "") {
      filters.category = readEstablishmentCategory(query.category);
    }

    if (typeof query.search === "string" && query.search.trim() !== "") {
      filters.search = query.search.trim();
    }

    const bounds = readMapBounds(query);

    if (bounds) {
      filters.minLat = bounds.minLat;
      filters.maxLat = bounds.maxLat;
      filters.minLng = bounds.minLng;
      filters.maxLng = bounds.maxLng;
    }

    const list = await establishmentService.getPublicEstablishments(filters);
    res.status(200).json(list);
  }

  async function getPublicDetail(req: Request, res: Response): Promise<void> {
    const id = readPositiveInteger(req.params.id, "El identificador del establecimiento");
    const detail = await establishmentService.getPublicDetail(id);
    res.status(200).json(detail);
  }

  return {
    create,
    getMyEstablishment,
    updateMyEstablishment,
    setManualStatus,
    getPublicEstablishments,
    getPublicDetail
  };
}

export type EstablishmentController = ReturnType<typeof createEstablishmentController>;