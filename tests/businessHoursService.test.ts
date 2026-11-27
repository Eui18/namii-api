import { test } from "node:test";
import assert from "node:assert/strict";
import { BusinessHoursService } from "../src/services/businessHoursService";
import { AppError } from "../src/utils/appError";
import { MockBusinessHoursRepository, MockEstablishmentRepository } from "./mocks";

interface HourInput {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: unknown;
}

function buildWeek(overrides: Record<number, HourInput> = {}): HourInput[] {
  const week: HourInput[] = [];

  for (let day = 1; day <= 7; day++) {
    week.push(
      overrides[day] ?? { dayOfWeek: day, opensAt: "08:00", closesAt: "18:00", isClosed: false }
    );
  }

  return week;
}

async function setup() {
  const estRepo = new MockEstablishmentRepository();
  const hoursRepo = new MockBusinessHoursRepository();
  const service = new BusinessHoursService(hoursRepo, estRepo);

  const establishment = await estRepo.create({
    ownerId: 10,
    name: "Tacos El Centro",
    category: "TAQUERIAS",
    description: "Tacos",
    phone: "9611234567",
    address: "Calle 1",
    latitude: 16.75,
    longitude: -93.11,
    coverPhotoUrl: null
  });

  return { service, establishment };
}

async function expectBadRequest(action: () => Promise<unknown>, message: RegExp) {
  await assert.rejects(action, (err: AppError) => {
    assert.equal(err.statusCode, 400);
    assert.match(err.message, message);
    return true;
  });
}

test("BusinessHoursService: guarda correctamente los siete días válidos", async () => {
  const { service } = await setup();

  const week = buildWeek({
    6: { dayOfWeek: 6, opensAt: "10:00", closesAt: "02:00", isClosed: false },
    7: { dayOfWeek: 7, opensAt: null, closesAt: null, isClosed: true }
  });

  const result = await service.setMyEstablishmentHours(10, week);

  assert.equal(result.length, 7);
  assert.equal(result[0].dayName, "Lunes");
  assert.equal(result[0].opensAt, "08:00:00");
  assert.equal(result[5].dayName, "Sábado");
  assert.equal(result[5].closesAt, "02:00:00");
  assert.equal(result[6].dayName, "Domingo");
  assert.equal(result[6].isClosed, true);
  assert.equal(result[6].opensAt, null);
});

test("BusinessHoursService: rechaza si no se envía un arreglo", async () => {
  const { service } = await setup();

  await expectBadRequest(
    () => service.setMyEstablishmentHours(10, { hours: [] }),
    /arreglo/i
  );
});

test("BusinessHoursService: rechaza si se envían menos de siete días", async () => {
  const { service } = await setup();

  await expectBadRequest(
    () => service.setMyEstablishmentHours(10, buildWeek().slice(0, 2)),
    /exactamente los 7 días/i
  );
});

test("BusinessHoursService: rechaza si se envían más de siete días", async () => {
  const { service } = await setup();

  const eight = buildWeek().concat([
    { dayOfWeek: 1, opensAt: "08:00", closesAt: "18:00", isClosed: false }
  ]);

  await expectBadRequest(
    () => service.setMyEstablishmentHours(10, eight),
    /exactamente los 7 días/i
  );
});

test("BusinessHoursService: rechaza días duplicados", async () => {
  const { service } = await setup();

  const week = buildWeek({
    2: { dayOfWeek: 1, opensAt: "08:00", closesAt: "18:00", isClosed: false }
  });

  await expectBadRequest(
    () => service.setMyEstablishmentHours(10, week),
    /está duplicado/i
  );
});

test("BusinessHoursService: rechaza día fuera de rango", async () => {
  const { service } = await setup();

  const week = buildWeek({
    1: { dayOfWeek: 0, opensAt: "08:00", closesAt: "18:00", isClosed: false }
  });

  await expectBadRequest(
    () => service.setMyEstablishmentHours(10, week),
    /entre 1.*y 7/i
  );
});

test("BusinessHoursService: rechaza isClosed no booleano", async () => {
  const { service } = await setup();

  const week = buildWeek({
    1: { dayOfWeek: 1, opensAt: "08:00", closesAt: "18:00", isClosed: "no" }
  });

  await expectBadRequest(
    () => service.setMyEstablishmentHours(10, week),
    /debe ser un booleano/i
  );
});

test("BusinessHoursService: rechaza apertura igual a cierre", async () => {
  const { service } = await setup();

  const week = buildWeek({
    1: { dayOfWeek: 1, opensAt: "10:00", closesAt: "10:00", isClosed: false }
  });

  await expectBadRequest(
    () => service.setMyEstablishmentHours(10, week),
    /no pueden ser idénticas/i
  );
});

test("BusinessHoursService: rechaza hora inválida", async () => {
  const { service } = await setup();

  const week = buildWeek({
    1: { dayOfWeek: 1, opensAt: "25:99", closesAt: "18:00", isClosed: false }
  });

  await expectBadRequest(
    () => service.setMyEstablishmentHours(10, week),
    /formato de apertura/i
  );
});

test("BusinessHoursService: día cerrado guarda horas en null", async () => {
  const { service } = await setup();

  const week = buildWeek({
    7: { dayOfWeek: 7, opensAt: "09:00", closesAt: "20:00", isClosed: true }
  });

  const result = await service.setMyEstablishmentHours(10, week);
  const sunday = result.find((h) => h.dayOfWeek === 7);

  assert.equal(sunday?.isClosed, true);
  assert.equal(sunday?.opensAt, null);
  assert.equal(sunday?.closesAt, null);
});

test("BusinessHoursService: un vendedor sin establecimiento recibe 404", async () => {
  const { service } = await setup();

  await assert.rejects(
    () => service.setMyEstablishmentHours(999, buildWeek()),
    (err: AppError) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

test("BusinessHoursService: horarios públicos de un id inexistente dan 404", async () => {
  const { service } = await setup();

  await assert.rejects(
    () => service.getByEstablishmentId(999),
    (err: AppError) => {
      assert.equal(err.statusCode, 404);
      assert.match(err.message, /no encontrado/i);
      return true;
    }
  );
});

test("BusinessHoursService: horarios públicos de un establecimiento existente", async () => {
  const { service, establishment } = await setup();

  await service.setMyEstablishmentHours(10, buildWeek());

  const result = await service.getByEstablishmentId(establishment.id);

  assert.equal(result.length, 7);
  assert.equal(result[0].dayName, "Lunes");
});