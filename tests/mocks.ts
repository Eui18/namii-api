import { User } from "../src/models/user";
import { CreateUserData, UserRepository } from "../src/repositories/userRepository";
import { Establishment, ManualStatus } from "../src/models/establishment";
import {
  CreateEstablishmentData,
  EstablishmentRepository,
  UpdateEstablishmentData
} from "../src/repositories/establishmentRepository";
import { EstablishmentFilterQuery } from "../src/dtos/establishmentDto";
import { BusinessHours } from "../src/models/businessHours";
import { BusinessHoursRepository } from "../src/repositories/businessHoursRepository";

export class MockUserRepository implements UserRepository {
  private users: User[] = [];
  private nextId = 1;

  async findById(id: number): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  }

    async create(data: CreateUserData): Promise<User> {
        const user: User = {
            id: this.nextId++,
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role
        };
        this.users.push(user);
        return { ...user };
    }
}

export class MockEstablishmentRepository implements EstablishmentRepository {
  private establishments: Establishment[] = [];
  private nextId = 1;

  async findById(id: number): Promise<Establishment | null> {
    const est = this.establishments.find((e) => e.id === id);
    return est ? { ...est } : null;
  }

  async findByOwnerId(ownerId: number): Promise<Establishment | null> {
    const est = this.establishments.find((e) => e.ownerId === ownerId);
    return est ? { ...est } : null;
  }

  async create(data: CreateEstablishmentData): Promise<Establishment> {
    const now = new Date();
    const est: Establishment = {
      id: this.nextId++,
      ownerId: data.ownerId,
      name: data.name,
      category: data.category,
      description: data.description,
      phone: data.phone,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      coverPhotoUrl: data.coverPhotoUrl,
      manualStatus: null,
      manualStatusDate: null,
      createdAt: now,
      updatedAt: now
    };
    this.establishments.push(est);
    return { ...est };
  }

  async update(id: number, data: UpdateEstablishmentData): Promise<Establishment> {
    const index = this.establishments.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error("Establishment not found");
    }
    const current = this.establishments[index];
    const updated: Establishment = {
      ...current,
      name: data.name !== undefined ? data.name : current.name,
      category: data.category !== undefined ? data.category : current.category,
      description: data.description !== undefined ? data.description : current.description,
      phone: data.phone !== undefined ? data.phone : current.phone,
      address: data.address !== undefined ? data.address : current.address,
      latitude: data.latitude !== undefined ? data.latitude : current.latitude,
      longitude: data.longitude !== undefined ? data.longitude : current.longitude,
      coverPhotoUrl: data.coverPhotoUrl !== undefined ? data.coverPhotoUrl : current.coverPhotoUrl,
      updatedAt: new Date()
    };
    this.establishments[index] = updated;
    return { ...updated };
  }

  async updateManualStatus(
    id: number,
    status: ManualStatus | null,
    date: string | null
  ): Promise<void> {
    const index = this.establishments.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.establishments[index].manualStatus = status;
      this.establishments[index].manualStatusDate = date;
    }
  }

  async findAll(filters?: EstablishmentFilterQuery): Promise<Establishment[]> {
    let result = [...this.establishments];

    if (filters?.category) {
      result = result.filter((e) => e.category === filters.category);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.description !== null && e.description.toLowerCase().includes(q))
      );
    }

    if (
      filters?.minLat !== undefined &&
      filters?.maxLat !== undefined &&
      filters?.minLng !== undefined &&
      filters?.maxLng !== undefined
    ) {
      const { minLat, maxLat, minLng, maxLng } = filters;
      result = result.filter(
        (e) =>
          e.latitude >= minLat &&
          e.latitude <= maxLat &&
          e.longitude >= minLng &&
          e.longitude <= maxLng
      );
    }

    return result.map((e) => ({ ...e }));
  }
}

export class MockBusinessHoursRepository implements BusinessHoursRepository {
  private hours: BusinessHours[] = [];

  async findByEstablishmentId(establishmentId: number): Promise<BusinessHours[]> {
    return this.hours
      .filter((h) => h.establishmentId === establishmentId)
      .map((h) => ({ ...h }));
  }

  async findByEstablishmentIds(establishmentIds: number[]): Promise<BusinessHours[]> {
    const idSet = new Set(establishmentIds);
    return this.hours
      .filter((h) => idSet.has(h.establishmentId))
      .map((h) => ({ ...h }));
  }

  async saveAll(
    establishmentId: number,
    hoursList: BusinessHours[]
  ): Promise<BusinessHours[]> {
    this.hours = this.hours.filter((h) => h.establishmentId !== establishmentId);
    for (const h of hoursList) {
      this.hours.push({ ...h, establishmentId });
    }
    return this.findByEstablishmentId(establishmentId);
  }
}