import { AppError } from "./appError";

export function readRequiredText(
  value: unknown,
  label: string,
  maxLength: number
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, `Escribe ${label}`);
  }

  const text = value.trim();

  if (text.length > maxLength) {
    throw new AppError(
      400,
      `${label} no puede superar ${maxLength} caracteres`
    );
  }

  return text;
}

export function readEmail(value: unknown): string {
  const email =
    typeof value === "string"
      ? value.trim().toLowerCase()
      : "";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email) || email.length > 150) {
    throw new AppError(400, "Escribe un correo válido");
  }

  return email;
}

export function readPassword(value: unknown): string {
  const password = typeof value === "string" ? value : "";

  const validPassword =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);

  if (!validPassword) {
    throw new AppError(
      400,
      "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
    );
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new AppError(400, "La contraseña es demasiado larga");
  }

  return password;
}