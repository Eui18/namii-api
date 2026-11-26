import { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Role, User } from "../models/user";
import { CreateUserData, UserRepository } from "./userRepository";
import { AppError } from "../utils/appError";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role
  };
}

export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await this.pool.query<UserRow[]>(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return null;
    }

    return toUser(rows[0]);
  }

  async create(data: CreateUserData): Promise<User> {
    try {
      const [result] = await this.pool.execute<ResultSetHeader>(
        `INSERT INTO users
          (name, email, password_hash, role)
         VALUES (?, ?, ?, ?)`,
        [
          data.name,
          data.email,
          data.passwordHash,
          data.role
        ]
      );

      return {
        id: result.insertId,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ER_DUP_ENTRY"
      ) {
        throw new AppError(409, "Ese correo ya está registrado");
      }

      throw error;
    }
  }
}