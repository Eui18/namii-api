import { test } from "node:test";
import assert from "node:assert/strict";
import { ScheduleService } from "../src/services/scheduleService";
import { BusinessHours } from "../src/models/businessHours";

const scheduleService = new ScheduleService();

test("isEstablishmentOpen: horario diurno dentro de horario está abierto", () => {
  const hours: BusinessHours[] = [
    { establishmentId: 1, dayOfWeek: 1, opensAt: "09:00:00", closesAt: "18:00:00", isClosed: false }
  ];

  const dateInside = new Date("2026-06-01T17:00:00Z");
  const isOpen = scheduleService.isEstablishmentOpen(null, null, hours, dateInside);
  assert.equal(isOpen, true);
});

test("isEstablishmentOpen: borde exacto de apertura (09:00:00) está abierto", () => {
  const hours: BusinessHours[] = [
    { establishmentId: 1, dayOfWeek: 1, opensAt: "09:00:00", closesAt: "18:00:00", isClosed: false }
  ];

  const exactOpen = new Date("2026-06-01T15:00:00Z");
  const isOpen = scheduleService.isEstablishmentOpen(null, null, hours, exactOpen);
  assert.equal(isOpen, true);
});

test("isEstablishmentOpen: borde exacto de cierre (18:00:00) está cerrado por ser exclusivo", () => {
  const hours: BusinessHours[] = [
    { establishmentId: 1, dayOfWeek: 1, opensAt: "09:00:00", closesAt: "18:00:00", isClosed: false }
  ];

  const exactClose = new Date("2026-06-02T00:00:00Z");
  const isOpen = scheduleService.isEstablishmentOpen(null, null, hours, exactClose);
  assert.equal(isOpen, false);
});

test("isEstablishmentOpen: día marcado como cerrado está cerrado", () => {
  const hours: BusinessHours[] = [
    { establishmentId: 1, dayOfWeek: 1, opensAt: null, closesAt: null, isClosed: true }
  ];

  const noon = new Date("2026-06-01T18:00:00Z");
  const isOpen = scheduleService.isEstablishmentOpen(null, null, hours, noon);
  assert.equal(isOpen, false);
});

test("isEstablishmentOpen: horario nocturno en la noche del mismo día está abierto", () => {
  const hours: BusinessHours[] = [
    { establishmentId: 1, dayOfWeek: 5, opensAt: "19:00:00", closesAt: "03:00:00", isClosed: false }
  ];

  const fridayNight = new Date("2026-06-06T03:30:00Z");
  const isOpen = scheduleService.isEstablishmentOpen(null, null, hours, fridayNight);
  assert.equal(isOpen, true);
});

test("isEstablishmentOpen: madrugada del día siguiente con turno nocturno previo está abierto", () => {
  const hours: BusinessHours[] = [
    { establishmentId: 1, dayOfWeek: 5, opensAt: "19:00:00", closesAt: "03:00:00", isClosed: false },
    { establishmentId: 1, dayOfWeek: 6, opensAt: "12:00:00", closesAt: "22:00:00", isClosed: false }
  ];

  const saturdayDawn = new Date("2026-06-06T07:30:00Z");
  const isOpen = scheduleService.isEstablishmentOpen(null, null, hours, saturdayDawn);
  assert.equal(isOpen, true);
});

test("isEstablishmentOpen: madrugada cuando el día anterior estaba cerrado da cerrado", () => {
  const hours: BusinessHours[] = [
    { establishmentId: 1, dayOfWeek: 5, opensAt: null, closesAt: null, isClosed: true },
    { establishmentId: 1, dayOfWeek: 6, opensAt: "12:00:00", closesAt: "22:00:00", isClosed: false }
  ];

  const saturdayDawn = new Date("2026-06-06T07:30:00Z");
  const isOpen = scheduleService.isEstablishmentOpen(null, null, hours, saturdayDawn);
  assert.equal(isOpen, false);
});

test("isEstablishmentOpen: respeta cambio de día en America/Mexico_City", () => {
  const hours: BusinessHours[] = [
    { establishmentId: 1, dayOfWeek: 1, opensAt: "09:00:00", closesAt: "18:00:00", isClosed: false },
    { establishmentId: 1, dayOfWeek: 2, opensAt: "10:00:00", closesAt: "19:00:00", isClosed: false }
  ];

  const mondayNightUTC = new Date("2026-06-02T02:00:00Z");
  const isOpenMondayNight = scheduleService.isEstablishmentOpen(null, null, hours, mondayNightUTC);
  assert.equal(isOpenMondayNight, false);

  const tuesdayMorning = new Date("2026-06-02T17:00:00Z");
  const isOpenTuesday = scheduleService.isEstablishmentOpen(null, null, hours, tuesdayMorning);
  assert.equal(isOpenTuesday, true);
});

test("isEstablishmentOpen: estado manual manda durante su fecha", () => {
  const hours: BusinessHours[] = [
    { establishmentId: 1, dayOfWeek: 1, opensAt: "09:00:00", closesAt: "18:00:00", isClosed: false }
  ];

  const outsideHours = new Date("2026-06-02T02:00:00Z");
  const isOpen = scheduleService.isEstablishmentOpen("OPEN", "2026-06-01", hours, outsideHours);
  assert.equal(isOpen, true);

  const insideHours = new Date("2026-06-01T17:00:00Z");
  const isClosed = scheduleService.isEstablishmentOpen("CLOSED", "2026-06-01", hours, insideHours);
  assert.equal(isClosed, false);
});

test("isEstablishmentOpen: estado manual deja de aplicar al día siguiente", () => {
  const hours: BusinessHours[] = [
    { establishmentId: 1, dayOfWeek: 1, opensAt: "09:00:00", closesAt: "18:00:00", isClosed: false },
    { establishmentId: 1, dayOfWeek: 2, opensAt: "09:00:00", closesAt: "18:00:00", isClosed: false }
  ];

  const nextDayInsideHours = new Date("2026-06-02T17:00:00Z");
  const isOpen = scheduleService.isEstablishmentOpen("CLOSED", "2026-06-01", hours, nextDayInsideHours);
  assert.equal(isOpen, true);
});