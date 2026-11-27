import { test } from "node:test";
import assert from "node:assert/strict";
import { EstablishmentService } from "../src/services/establishmentService";
import { MockBusinessHoursRepository, MockEstablishmentRepository } from "./mocks";
import { ScheduleService } from "../src/services/scheduleService";
import { AppError } from "../src/utils/appError";
import { BusinessHours } from "../src/models/businessHours";

function createService(): {
  service: EstablishmentService;
  estRepo: MockEstablishmentRepository;
  hoursRepo: MockBusinessHoursRepository;
  scheduleService: ScheduleService;
} {
  const estRepo = new MockEstablishmentRepository();
  const hoursRepo = new MockBusinessHoursRepository();
  const scheduleService = new ScheduleService();
  const service = new EstablishmentService(estRepo, hoursRepo, scheduleService);
  return { service, estRepo, hoursRepo, scheduleService };
}

test("EstablishmentService: Registro de establecimiento exitoso", async () => {
  const { service } = createService();

  const result = await service.create(1, {
    name: "Tacos El Pastor",
    category: "TAQUERIAS",
    description: "Los mejores tacos al pastor",
    phone: "9611234567",
    address: "Av Central 123",
    latitude: 16.753,
    longitude: -93.115
  });

  assert.equal(result.name, "Tacos El Pastor");
  assert.equal(result.category, "TAQUERIAS");
  assert.equal(result.ownerId, 1);
  assert.equal(result.isOpen, false);
});

test("EstablishmentService: Regla: cada vendedor solo puede tener un establecimiento", async () => {
  const { service } = createService();

  await service.create(1, {
    name: "Tacos 1",
    category: "TAQUERIAS",
    phone: "9611234567",
    address: "Calle 1",
    latitude: 16.75,
    longitude: -93.11
  });

  await assert.rejects(
    async () => {
      await service.create(1, {
        name: "Tacos 2",
        category: "TAQUERIAS",
        phone: "9617654321",
        address: "Calle 2",
        latitude: 16.76,
        longitude: -93.12
      });
    },
    (err: AppError) => {
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /ya tiene un establecimiento/i);
      return true;
    }
  );
});

test("EstablishmentService: Guarda descripcion y coverPhotoUrl como null si vienen con espacios o vacios", async () => {
  const { service } = createService();

  const result = await service.create(10, {
    name: "Tiendita Doña Mary",
    category: "RESTAURANTES",
    description: "   ",
    phone: "9611234567",
    address: "Calle 5",
    latitude: 16.75,
    longitude: -93.11,
    coverPhotoUrl: ""
  });

  assert.equal(result.description, null);
  assert.equal(result.coverPhotoUrl, null);
});

test("EstablishmentService: Rechaza coordenadas invalidas o fuera de rango", async () => {
  const { service } = createService();

  await assert.rejects(
    async () => {
      await service.create(1, {
        name: "Lugar",
        category: "RESTAURANTES",
        phone: "9611234567",
        address: "Calle 1",
        latitude: 95,
        longitude: -93.11
      });
    },
    (err: AppError) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /entre -90 y 90/i);
      return true;
    }
  );

  await assert.rejects(
    async () => {
      await service.create(1, {
        name: "Lugar",
        category: "RESTAURANTES",
        phone: "9611234567",
        address: "Calle 1",
        latitude: "invalido",
        longitude: -93.11
      });
    },
    (err: AppError) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /debe ser un número/i);
      return true;
    }
  );
});

test("EstablishmentService: Consulta y actualizacion del establecimiento propio", async () => {
  const { service } = createService();

  await service.create(2, {
    name: "Café Chiapas",
    category: "CAFETERIAS",
    phone: "9619876543",
    address: "Calle Real 45",
    latitude: 16.75,
    longitude: -93.11
  });

  const myEst = await service.getMyEstablishment(2);
  assert.equal(myEst.name, "Café Chiapas");
  assert.equal(myEst.ownerId, 2);

  const updated = await service.updateMyEstablishment(2, {
    name: "Café Chiapas Tradicional",
    description: "Café de altura 100% orgánico"
  });
  assert.equal(updated.name, "Café Chiapas Tradicional");
  assert.equal(updated.description, "Café de altura 100% orgánico");
});

test("EstablishmentService: Error 404 al consultar establecimiento propio inexistente", async () => {
  const { service } = createService();

  await assert.rejects(
    async () => {
      await service.getMyEstablishment(999);
    },
    (err: AppError) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

test("EstablishmentService: otro vendedor no puede modificar el establecimiento ajeno", async () => {
  const { service } = createService();

  await service.create(2, {
    name: "Café Chiapas",
    category: "CAFETERIAS",
    phone: "9619876543",
    address: "Calle Real 45",
    latitude: 16.75,
    longitude: -93.11
  });

  await assert.rejects(
    async () => {
      await service.updateMyEstablishment(99, { name: "Intento ajeno" });
    },
    (err: AppError) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );

  await assert.rejects(
    async () => {
      await service.setManualStatus(99, "OPEN");
    },
    (err: AppError) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );

  const original = await service.getMyEstablishment(2);
  assert.equal(original.name, "Café Chiapas");
});

test("EstablishmentService: Validacion estricta de setManualStatus", async () => {
  const { service } = createService();

  await service.create(3, {
    name: "Panaderia San Jose",
    category: "PANADERIAS",
    phone: "9611112233",
    address: "Central Poniente 8",
    latitude: 16.75,
    longitude: -93.11
  });

  await assert.rejects(
    async () => {
      await service.setManualStatus(3, undefined);
    },
    (err: AppError) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /OPEN, CLOSED o null/i);
      return true;
    }
  );

  await assert.rejects(
    async () => {
      await service.setManualStatus(3, "ABIERTO");
    },
    (err: AppError) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /OPEN, CLOSED o null/i);
      return true;
    }
  );

  const resOpen = await service.setManualStatus(3, "OPEN");
  assert.equal(resOpen.manualStatus, "OPEN");
  assert.equal(resOpen.isOpen, true);

  const resClosed = await service.setManualStatus(3, "CLOSED");
  assert.equal(resClosed.manualStatus, "CLOSED");
  assert.equal(resClosed.isOpen, false);

  const resNull = await service.setManualStatus(3, null);
  assert.equal(resNull.manualStatus, null);
});

test("EstablishmentService: Consulta publica no expone datos sensibles del vendedor", async () => {
  const { service, hoursRepo } = createService();

  const created = await service.create(5, {
    name: "Tortas El Chavo",
    category: "RESTAURANTES",
    phone: "9612223344",
    address: "Calle 10",
    latitude: 16.75,
    longitude: -93.11
  });

  const fullWeek: BusinessHours[] = [
    { establishmentId: created.id, dayOfWeek: 1, opensAt: "08:00:00", closesAt: "20:00:00", isClosed: false },
    { establishmentId: created.id, dayOfWeek: 2, opensAt: "08:00:00", closesAt: "20:00:00", isClosed: false },
    { establishmentId: created.id, dayOfWeek: 3, opensAt: "08:00:00", closesAt: "20:00:00", isClosed: false },
    { establishmentId: created.id, dayOfWeek: 4, opensAt: "08:00:00", closesAt: "20:00:00", isClosed: false },
    { establishmentId: created.id, dayOfWeek: 5, opensAt: "08:00:00", closesAt: "20:00:00", isClosed: false },
    { establishmentId: created.id, dayOfWeek: 6, opensAt: "08:00:00", closesAt: "20:00:00", isClosed: false },
    { establishmentId: created.id, dayOfWeek: 7, opensAt: null, closesAt: null, isClosed: true }
  ];
  await hoursRepo.saveAll(created.id, fullWeek);

  const publicList = await service.getPublicEstablishments();
  assert.equal(publicList.length, 1);
  const item = publicList[0];
  assert.equal("ownerId" in item, false);
  assert.equal("manualStatusDate" in item, false);

  const publicDetail = await service.getPublicDetail(created.id);
  assert.equal("ownerId" in publicDetail, false);
  assert.equal("manualStatusDate" in publicDetail, false);
  assert.equal(publicDetail.businessHours.length, 7);
  assert.equal(publicDetail.businessHours[0].dayName, "Lunes");
});

test("EstablishmentService: Lista publica incluye establecimientos cerrados", async () => {
  const { service } = createService();

  await service.create(8, {
    name: "Hamburguesas Nocturnas",
    category: "RESTAURANTES",
    phone: "9613334455",
    address: "Calle 12",
    latitude: 16.75,
    longitude: -93.11
  });

  await service.setManualStatus(8, "CLOSED");

  const list = await service.getPublicEstablishments();
  assert.equal(list.length, 1);
  assert.equal(list[0].isOpen, false);
  assert.equal(list[0].name, "Hamburguesas Nocturnas");
});