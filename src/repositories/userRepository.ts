import { Role, User } from "../models/user";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;

  create(data: CreateUserData): Promise<User>;
}
