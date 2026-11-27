import { BusinessHoursItemResponse } from "./businessHoursDto";
import {
  Establishment,
  EstablishmentCategory,
  ManualStatus
} from "../models/establishment";

export interface CreateEstablishmentRequest {
  name: string;
  category: EstablishmentCategory;
  description?: string | null;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  coverPhotoUrl?: string | null;
}

export interface UpdateEstablishmentRequest {
  name?: string;
  category?: EstablishmentCategory;
  description?: string | null;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coverPhotoUrl?: string | null;
}

export interface EstablishmentFilterQuery {
  category?: EstablishmentCategory;
  search?: string;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
}

export interface EstablishmentResponse {
  id: number;
  name: string;
  category: EstablishmentCategory;
  description: string | null;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  coverPhotoUrl: string | null;
  manualStatus: ManualStatus | null;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerEstablishmentResponse extends EstablishmentResponse {
  ownerId: number;
  manualStatusDate: string | null;
}

export interface EstablishmentDetailResponse extends EstablishmentResponse {
  businessHours: BusinessHoursItemResponse[];
}

export interface SellerEstablishmentDetailResponse extends SellerEstablishmentResponse {
  businessHours: BusinessHoursItemResponse[];
}

export function toEstablishmentResponse(
  est: Establishment,
  isOpen: boolean
): EstablishmentResponse {
  return {
    id: est.id,
    name: est.name,
    category: est.category,
    description: est.description,
    phone: est.phone,
    address: est.address,
    latitude: Number(est.latitude),
    longitude: Number(est.longitude),
    coverPhotoUrl: est.coverPhotoUrl,
    manualStatus: est.manualStatus,
    isOpen,
    createdAt: est.createdAt,
    updatedAt: est.updatedAt
  };
}

export function toSellerEstablishmentResponse(
  est: Establishment,
  isOpen: boolean
): SellerEstablishmentResponse {
  return {
    ...toEstablishmentResponse(est, isOpen),
    ownerId: est.ownerId,
    manualStatusDate: est.manualStatusDate
  };
}