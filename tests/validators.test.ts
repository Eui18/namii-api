import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readCoordinate,
  readDayOfWeek,
  readEmail,
  readEstablishmentCategory,
  readName,
  readOptionalText,
  readPassword,
  readTime
} from "../src/utils/validators";
import { AppError } from "../src/utils/appError";

test("Acepta un nombre válido", () => {
  assert.equal(readName("  María López  "), "María López");
});

test("Rechaza un nombre vacío", () => {
  assert.throws(() => readName("   "), /Ingresa un nombre válido/i);
});

test("Normaliza un correo", () => {
  assert.equal(readEmail("  Usuario@Dominio.COM "), "usuario@dominio.com");
});

test("Rechaza un correo inválido", () => {
  assert.throws(() => readEmail("invalido"), /correo electrónico válido/i);
});

test("Acepta una contraseña que cumple las reglas", () => {
  assert.equal(readPassword("Secret01"), "Secret01");
});

test("Rechaza una contraseña sin mayúscula", () => {
  assert.throws(() => readPassword("secret01"), /mayúscula/i);
});

test("Rechaza una contraseña sin número", () => {
  assert.throws(() => readPassword("Secretooo"), /número/i);
});

test("readCoordinate: acepta coordenadas válidas y redondea a 6 decimales", () => {
  assert.equal(readCoordinate(16.7534567, "lat", -90, 90), 16.753457);
  assert.equal(readCoordinate("-93.115432", "lng", -180, 180), -93.115432);
});

test("readCoordinate: rechaza valores fuera de rango", () => {
  assert.throws(() => readCoordinate(91, "lat", -90, 90), (err: AppError) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
});

test("readCoordinate: rechaza null, undefined, cadena vacía y texto no numérico", () => {
  assert.throws(() => readCoordinate(null, "lat", -90, 90), /es obligatorio/i);
  assert.throws(() => readCoordinate(undefined, "lat", -90, 90), /es obligatorio/i);
  assert.throws(() => readCoordinate("", "lat", -90, 90), /es obligatorio/i);
  assert.throws(() => readCoordinate("   ", "lat", -90, 90), /es obligatorio/i);
  assert.throws(() => readCoordinate("abc", "lat", -90, 90), /debe ser un número/i);
});

test("readOptionalText: null, undefined, vacíos y espacios devuelven null", () => {
  assert.equal(readOptionalText(null, "desc", 100), null);
  assert.equal(readOptionalText(undefined, "desc", 100), null);
  assert.equal(readOptionalText("", "desc", 100), null);
  assert.equal(readOptionalText("   ", "desc", 100), null);
  assert.equal(readOptionalText("  Hola mundo  ", "desc", 100), "Hola mundo");
});

test("readEstablishmentCategory: valida categorías permitidas y rechaza inválidas", () => {
  assert.equal(readEstablishmentCategory("TAQUERIAS"), "TAQUERIAS");
  assert.equal(readEstablishmentCategory("  cafeterias "), "CAFETERIAS");
  assert.throws(() => readEstablishmentCategory("GIMNASIO"), /Categoría no válida/i);
});

test("readDayOfWeek: acepta 1 a 7 y rechaza otros", () => {
  assert.equal(readDayOfWeek(1), 1);
  assert.equal(readDayOfWeek(7), 7);
  assert.throws(() => readDayOfWeek(0), /entre 1.*y 7/i);
  assert.throws(() => readDayOfWeek(8), /entre 1.*y 7/i);
});

test("readTime: valida formato de hora HH:MM y HH:MM:SS", () => {
  assert.equal(readTime("08:30", "apertura"), "08:30:00");
  assert.equal(readTime("08:30:45", "apertura"), "08:30:45");
  assert.throws(() => readTime("25:00", "apertura"), /formato de apertura debe ser/i);
});