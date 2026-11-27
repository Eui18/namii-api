import { ESTABLISHMENT_CATEGORIES, EstablishmentCategory } from "../models/establishment";
import { AppError } from "./appError";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export function readRequiredText(
  value: unknown,
  fieldName: string,
  maxLength: number
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, "El campo " + fieldName + " es obligatorio");
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    throw new AppError(
      400,
      "El campo " + fieldName + " no puede superar los " + maxLength + " caracteres"
    );
  }

  return trimmed;
}

export function readOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(400, "El campo " + fieldName + " debe ser una cadena de texto");
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  if (trimmed.length > maxLength) {
    throw new AppError(
      400,
      "El campo " + fieldName + " no puede superar los " + maxLength + " caracteres"
    );
  }

  return trimmed;
}

export function readName(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, "Ingresa un nombre válido");
  }

  const trimmed = value.trim();

  if (trimmed.length < 2 || trimmed.length > 80) {
    throw new AppError(400, "El nombre debe tener entre 2 y 80 caracteres");
  }

  return trimmed;
}

export function readEmail(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, "Ingresa un correo electrónico");
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.length > 120 || !EMAIL_REGEX.test(normalized)) {
    throw new AppError(400, "Ingresa un correo electrónico válido");
  }

  return normalized;
}

export function readPassword(value: unknown): string {
  if (typeof value !== "string" || value === "") {
    throw new AppError(400, "Ingresa una contraseña");
  }

  if (!PASSWORD_REGEX.test(value)) {
    throw new AppError(
      400,
      "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
    );
  }

  return value;
}

export function readPhoneNumber(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, "Ingresa un número de teléfono");
  }

  const cleaned = value.trim().replace(/\D/g, "");

  if (cleaned.length < 7 || cleaned.length > 15) {
    throw new AppError(400, "El teléfono debe contener entre 7 y 15 dígitos numéricos");
  }

  return cleaned;
}

export function readCoordinate(
  value: unknown,
  label: string,
  min: number,
  max: number
): number {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    throw new AppError(400, label + " es obligatorio y debe ser un número");
  }

  const num = typeof value === "number" ? value : Number(value);

  if (typeof num !== "number" || isNaN(num)) {
    throw new AppError(400, label + " debe ser un número");
  }

  if (!isFinite(num) || isNaN(num) || num < min || num > max) {
    throw new AppError(
      400,
      label + " debe ser un valor numérico entre " + min + " y " + max
    );
  }

  return Math.round(num * 1000000) / 1000000;
}

export function readPositiveInteger(value: unknown, label: string): number {
  const num = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(num) || num <= 0) {
    throw new AppError(400, label + " debe ser un identificador numérico válido");
  }

  return num;
}

export function readEstablishmentCategory(value: unknown): EstablishmentCategory {
  if (typeof value !== "string") {
    throw new AppError(400, "Selecciona una categoría para el establecimiento");
  }

  const uppercase = value.trim().toUpperCase() as EstablishmentCategory;

  if (!ESTABLISHMENT_CATEGORIES.includes(uppercase)) {
    throw new AppError(
      400,
      "Categoría no válida. Opciones permitidas: " + ESTABLISHMENT_CATEGORIES.join(", ")
    );
  }

  return uppercase;
}

export function readDayOfWeek(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(num) || num < 1 || num > 7) {
    throw new AppError(400, "El día de la semana debe ser un entero entre 1 (Lunes) y 7 (Domingo)");
  }

  return num;
}

export function readTime(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, "La hora de " + fieldName + " es obligatoria");
  }

  const trimmed = value.trim();

  if (!TIME_REGEX.test(trimmed)) {
    throw new AppError(400, "El formato de " + fieldName + " debe ser HH:MM o HH:MM:SS");
  }

  return trimmed.length === 5 ? trimmed + ":00" : trimmed;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function readMapBounds(query: Record<string, unknown>): MapBounds | null {
  const keys = ["minLat", "maxLat", "minLng", "maxLng"];
  const sent = keys.filter((key) => query[key] !== undefined);

  if (sent.length === 0) {
    return null;
  }

  if (sent.length !== keys.length) {
    throw new AppError(
      400,
      "Para filtrar por mapa debes enviar minLat, maxLat, minLng y maxLng"
    );
  }

  const minLat = readCoordinate(query.minLat, "minLat", -90, 90);
  const maxLat = readCoordinate(query.maxLat, "maxLat", -90, 90);
  const minLng = readCoordinate(query.minLng, "minLng", -180, 180);
  const maxLng = readCoordinate(query.maxLng, "maxLng", -180, 180);

  if (minLat > maxLat) {
    throw new AppError(400, "minLat no puede ser mayor que maxLat");
  }

  if (minLng > maxLng) {
    throw new AppError(400, "minLng no puede ser mayor que maxLng");
  }

  return { minLat, maxLat, minLng, maxLng };
}