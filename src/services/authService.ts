import bcrypt from "bcryptjs";
import {AuthResponse, toUserResponse} from "../dtos/authDto";
import { Role } from "../models/user";
import { UserRepository } from "../repositories/userRepository";
import { AppError } from "../utils/appError";
import { generateToken } from "../utils/token";
import {
  readEmail,
  readPassword,
  readRequiredText
} from "../utils/validators";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository
  ) {}

  async register(
    role: Role,
    body: Record<string, unknown>
  ): Promise<AuthResponse> {
    const name = readRequiredText(
      body.name,
      "tu nombre",
      100
    );

    const email = readEmail(body.email);
    const password = readPassword(body.password);

    if (body.confirmPassword !== password) {
      throw new AppError(
        400,
        "La contraseña y su confirmación deben coincidir"
      );
    }

    const existingUser =
      await this.userRepository.findByEmail(email);

    if (existingUser !== null) {
      throw new AppError(409, "Ese correo ya está registrado");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      name,
      email,
      passwordHash,
      role
    });

    return {
      token: generateToken(user.id, user.role),
      user: toUserResponse(user)
    };
  }

  async login(
    role: Role,
    body: Record<string, unknown>
  ): Promise<AuthResponse> {
    const email = readEmail(body.email);

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!password) {
      throw new AppError(
        400,
        "Escribe tu correo y tu contraseña"
      );
    }

    const user = await this.userRepository.findByEmail(email);

    const passwordMatches =
      user !== null &&
      await bcrypt.compare(password, user.passwordHash);

    if (
      user === null ||
      !passwordMatches ||
      user.role !== role
    ) {
      throw new AppError(
        401,
        "Correo o contraseña incorrectos"
      );
    }

    return {
      token: generateToken(user.id, user.role),
      user: toUserResponse(user)
    };
  }
}
