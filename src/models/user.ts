export type Role = "CLIENTE" | "VENDEDOR";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}