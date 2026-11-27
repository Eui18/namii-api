import { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Establishment, EstablishmentCategory, ManualStatus } from "../models/establishment";
import { EstablishmentFilterQuery } from "../dtos/establishmentDto";
import {
  CreateEstablishmentData,
  EstablishmentRepository,
  UpdateEstablishmentData
} from "./establishmentRepository";
import { AppError } from "../utils/appError";

interface EstablishmentRow extends RowDataPacket {
  id: number;
  owner_id: number;
  name: string;
  category: EstablishmentCategory;
  description: string | null;
  phone: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  cover_photo_url: string | null;
  manual_status: ManualStatus | null;
  manual_status_date: string | null;
  created_at: Date;
  updated_at: Date;
}

const ESTABLISHMENT_COLUMNS =
  "id, owner_id, name, category, description, phone, address, latitude, longitude, cover_photo_url, manual_status, DATE_FORMAT(manual_status_date, '%Y-%m-%d') AS manual_status_date, created_at, updated_at";

function toEstablishment(row: EstablishmentRow): Establishment {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    category: row.category,
    description: row.description,
    phone: row.phone,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    coverPhotoUrl: row.cover_photo_url,
    manualStatus: row.manual_status,
    manualStatusDate: row.manual_status_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function isDuplicateEntry(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}

export class EstablishmentRepositoryImpl implements EstablishmentRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: number): Promise<Establishment | null> {
    const [rows] = await this.pool.query<EstablishmentRow[]>(
      "SELECT " + ESTABLISHMENT_COLUMNS + " FROM establishments WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return toEstablishment(rows[0]);
  }

  async findByOwnerId(ownerId: number): Promise<Establishment | null> {
    const [rows] = await this.pool.query<EstablishmentRow[]>(
      "SELECT " + ESTABLISHMENT_COLUMNS + " FROM establishments WHERE owner_id = ? LIMIT 1",
      [ownerId]
    );

    if (rows.length === 0) {
      return null;
    }

    return toEstablishment(rows[0]);
  }

  async create(data: CreateEstablishmentData): Promise<Establishment> {
    try {
      const [result] = await this.pool.execute<ResultSetHeader>(
        "INSERT INTO establishments (owner_id, name, category, description, phone, address, latitude, longitude, cover_photo_url) " +
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          data.ownerId,
          data.name,
          data.category,
          data.description,
          data.phone,
          data.address,
          data.latitude,
          data.longitude,
          data.coverPhotoUrl
        ]
      );

      const created = await this.findById(result.insertId);

      if (!created) {
        throw new Error("No se pudo recuperar el establecimiento recién creado");
      }

      return created;
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new AppError(409, "El vendedor ya tiene un establecimiento registrado");
      }

      throw error;
    }
  }

  async update(id: number, data: UpdateEstablishmentData): Promise<Establishment> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.category !== undefined) {
      fields.push("category = ?");
      values.push(data.category);
    }
    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }
    if (data.phone !== undefined) {
      fields.push("phone = ?");
      values.push(data.phone);
    }
    if (data.address !== undefined) {
      fields.push("address = ?");
      values.push(data.address);
    }
    if (data.latitude !== undefined) {
      fields.push("latitude = ?");
      values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      fields.push("longitude = ?");
      values.push(data.longitude);
    }
    if (data.coverPhotoUrl !== undefined) {
      fields.push("cover_photo_url = ?");
      values.push(data.coverPhotoUrl);
    }

    if (fields.length > 0) {
      values.push(id);
      await this.pool.execute(
        "UPDATE establishments SET " + fields.join(", ") + " WHERE id = ?",
        values
      );
    }

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error("No se encontró el establecimiento actualizado");
    }

    return updated;
  }

  async updateManualStatus(
    id: number,
    status: ManualStatus | null,
    date: string | null
  ): Promise<void> {
    await this.pool.execute(
      "UPDATE establishments SET manual_status = ?, manual_status_date = ? WHERE id = ?",
      [status, date, id]
    );
  }

  async findAll(filters: EstablishmentFilterQuery = {}): Promise<Establishment[]> {
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.category) {
      whereConditions.push("category = ?");
      params.push(filters.category);
    }

    if (filters.search && filters.search.trim() !== "") {
      whereConditions.push("(name LIKE ? OR description LIKE ?)");
      const term = "%" + filters.search.trim() + "%";
      params.push(term, term);
    }

    if (
      filters.minLat !== undefined &&
      filters.maxLat !== undefined &&
      filters.minLng !== undefined &&
      filters.maxLng !== undefined
    ) {
      whereConditions.push("latitude BETWEEN ? AND ?");
      params.push(filters.minLat, filters.maxLat);
      whereConditions.push("longitude BETWEEN ? AND ?");
      params.push(filters.minLng, filters.maxLng);
    }

    const whereClause =
      whereConditions.length > 0 ? " WHERE " + whereConditions.join(" AND ") : "";
    const sql =
      "SELECT " + ESTABLISHMENT_COLUMNS + " FROM establishments" + whereClause + " ORDER BY name ASC";

    const [rows] = await this.pool.query<EstablishmentRow[]>(sql, params);
    return rows.map(toEstablishment);
  }
}