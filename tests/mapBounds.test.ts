import { test } from "node:test";
import assert from "node:assert/strict";
import { readMapBounds } from "../src/utils/validators";
import { AppError } from "../src/utils/appError";

function expectBadRequest(query: Record<string, unknown>, message: RegExp) {
  assert.throws(
    () => readMapBounds(query),
    (err: AppError) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, message);
      return true;
    }
  );
}

test("readMapBounds: sin parámetros de mapa devuelve null", () => {
  assert.equal(readMapBounds({}), null);
  assert.equal(readMapBounds({ search: "tacos" }), null);
});

test("readMapBounds: acepta los cuatro límites válidos", () => {
  const bounds = readMapBounds({
    minLat: "16.70",
    maxLat: "16.80",
    minLng: "-93.20",
    maxLng: "-93.00"
  });

  assert.deepEqual(bounds, { minLat: 16.7, maxLat: 16.8, minLng: -93.2, maxLng: -93 });
});

test("readMapBounds: rechaza límites incompletos", () => {
  expectBadRequest({ minLat: "16.70" }, /minLat, maxLat, minLng y maxLng/i);
  expectBadRequest(
    { minLat: "16.70", maxLat: "16.80", minLng: "-93.20" },
    /minLat, maxLat, minLng y maxLng/i
  );
});

test("readMapBounds: rechaza valores no numéricos o vacíos", () => {
  expectBadRequest(
    { minLat: "abc", maxLat: "16.80", minLng: "-93.20", maxLng: "-93.00" },
    /debe ser un número/i
  );
  expectBadRequest(
    { minLat: "", maxLat: "16.80", minLng: "-93.20", maxLng: "-93.00" },
    /es obligatorio/i
  );
});

test("readMapBounds: rechaza valores fuera de rango", () => {
  expectBadRequest(
    { minLat: "16.70", maxLat: "95", minLng: "-93.20", maxLng: "-93.00" },
    /entre -90 y 90/i
  );
  expectBadRequest(
    { minLat: "16.70", maxLat: "16.80", minLng: "-93.20", maxLng: "200" },
    /entre -180 y 180/i
  );
});

test("readMapBounds: rechaza mínimos mayores que máximos", () => {
  expectBadRequest(
    { minLat: "17", maxLat: "16", minLng: "-93.20", maxLng: "-93.00" },
    /minLat no puede ser mayor/i
  );
  expectBadRequest(
    { minLat: "16", maxLat: "17", minLng: "-93.00", maxLng: "-93.20" },
    /minLng no puede ser mayor/i
  );
});