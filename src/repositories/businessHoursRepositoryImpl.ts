import { Pool, RowDataPacket } from "mysql2/promise";
import { BusinessHours } from "../models/businessHours";
import { BusinessHoursRepository } from "./businessHoursRepository";

interface BusinessHoursRow extends RowDataPacket {
  id: number;
  establishment_id: number;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: number | boolean;
}

function toBusinessHours(row: BusinessHoursRow): BusinessHours {
  return {
    id: row.id,
    establishmentId: row.establishment_id,
    dayOfWeek: row.day_of_week,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    isClosed: Boolean(row.is_closed)
  };
}

export class BusinessHoursRepositoryImpl implements BusinessHoursRepository {
  constructor(private readonly pool: Pool) {}

  async findByEstablishmentId(establishmentId: number): Promise<BusinessHours[]> {
    const [rows] = await this.pool.query<BusinessHoursRow[]>(
      "SELECT id, establishment_id, day_of_week, opens_at, closes_at, is_closed " +
        "FROM business_hours " +
        "WHERE establishment_id = ? " +
        "ORDER BY day_of_week ASC",
      [establishmentId]
    );

    return rows.map(toBusinessHours);
  }

  async findByEstablishmentIds(establishmentIds: number[]): Promise<BusinessHours[]> {
    if (establishmentIds.length === 0) {
      return [];
    }

    const placeholders = establishmentIds.map(() => "?").join(", ");
    const [rows] = await this.pool.query<BusinessHoursRow[]>(
      "SELECT id, establishment_id, day_of_week, opens_at, closes_at, is_closed " +
        "FROM business_hours " +
        "WHERE establishment_id IN (" + placeholders + ") " +
        "ORDER BY establishment_id ASC, day_of_week ASC",
      establishmentIds
    );

    return rows.map(toBusinessHours);
  }

  async saveAll(
    establishmentId: number,
    hoursList: BusinessHours[]
  ): Promise<BusinessHours[]> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const item of hoursList) {
        await connection.execute(
          "INSERT INTO business_hours (establishment_id, day_of_week, opens_at, closes_at, is_closed) " +
            "VALUES (?, ?, ?, ?, ?) " +
            "ON DUPLICATE KEY UPDATE " +
            "opens_at = VALUES(opens_at), " +
            "closes_at = VALUES(closes_at), " +
            "is_closed = VALUES(is_closed)",
          [
            establishmentId,
            item.dayOfWeek,
            item.opensAt,
            item.closesAt,
            item.isClosed ? 1 : 0
          ]
        );
      }

      await connection.commit();
      return this.findByEstablishmentId(establishmentId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}