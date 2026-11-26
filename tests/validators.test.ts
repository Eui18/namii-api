import { test } from "node:test";
import assert from "node:assert/strict";

import {
  readEmail,
  readPassword,
  readRequiredText
} from "../src/utils/validators";

import { AppError } from "../src/utils/appError";

test("Acepta un nombre válido", () => {
  assert.equal(
    readRequiredText(" Laura ", "tu nombre", 100),
    "Laura"
  );
});

test("Rechaza un nombre vacío", () => {
  assert.throws(
    () => readRequiredText("", "tu nombre", 100),
    AppError
  );
});

test("Normaliza un correo", () => {
  assert.equal(
    readEmail(" LAURA@GMAIL.COM "),
    "laura@gmail.com"
  );
});

test("Rechaza un correo inválido", () => {
  assert.throws(
    () => readEmail("correo-invalido"),
    AppError
  );
});

test("Acepta una contraseña que cumple las reglas", () => {
  assert.equal(
    readPassword("Namii1234"),
    "Namii1234"
  );
});

test("Rechaza una contraseña sin mayúscula", () => {
  assert.throws(
    () => readPassword("namii1234"),
    AppError
  );
});

test("Rechaza una contraseña sin número", () => {
  assert.throws(
    () => readPassword("NamiiSegura"),
    AppError
  );
});