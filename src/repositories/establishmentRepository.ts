import { Establishment, EstablishmentCategory, ManualStatus } from "../models/establishment";
import { EstablishmentFilterQuery } from "../dtos/establishmentDto";

export interface CreateEstablishmentData {
  ownerId: number;
  name: string;
  category: EstablishmentCategory;
  description: string | null;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  coverPhotoUrl: string | null;
}

export interface UpdateEstablishmentData {
  name?: string;
  category?: EstablishmentCategory;
  description?: string | null;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coverPhotoUrl?: string | null;
}

export interface EstablishmentRepository {
  findById(id: number): Promise<Establishment | null>;
  findByOwnerId(ownerId: number): Promise<Establishment | null>;
  create(data: CreateEstablishmentData): Promise<Establishment>;
  update(id: number, data: UpdateEstablishmentData): Promise<Establishment>;
  updateManualStatus(id: number, status: ManualStatus | null, date: string | null): Promise<void>;
  findAll(filters?: EstablishmentFilterQuery): Promise<Establishment[]>;
}