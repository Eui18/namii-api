import { BusinessHours } from "../models/businessHours";

export interface BusinessHoursRepository {
  findByEstablishmentId(establishmentId: number): Promise<BusinessHours[]>;
  findByEstablishmentIds(establishmentIds: number[]): Promise<BusinessHours[]>;
  saveAll(establishmentId: number, hours: BusinessHours[]): Promise<BusinessHours[]>;
}