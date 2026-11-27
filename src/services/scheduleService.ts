import { BusinessHours } from "../models/businessHours";
import { ManualStatus } from "../models/establishment";

export interface MexicoCityDateTime {
  dayOfWeek: number;
  timeString: string;
  dateString: string;
}

export function getMexicoCityDateTime(baseDate: Date = new Date()): MexicoCityDateTime {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short"
  });

  const parts = formatter.formatToParts(baseDate);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const year = map.year;
  const month = map.month;
  const day = map.day;
  const hour = (map.hour === "24" ? "00" : map.hour).padStart(2, "0");
  const minute = map.minute.padStart(2, "0");
  const second = map.second.padStart(2, "0");

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7
  };

  const dayOfWeek = weekdayMap[map.weekday] || 1;
  const timeString = hour + ":" + minute + ":" + second;
  const dateString = year + "-" + month + "-" + day;

  return { dayOfWeek, timeString, dateString };
}

export class ScheduleService {
  isEstablishmentOpen(
    manualStatus: ManualStatus | null,
    manualStatusDate: string | null,
    businessHours: BusinessHours[],
    referenceDate: Date = new Date()
  ): boolean {
    const { dayOfWeek, timeString, dateString } = getMexicoCityDateTime(referenceDate);

    if (manualStatus !== null && manualStatusDate !== null) {
      if (manualStatusDate === dateString) {
        return manualStatus === "OPEN";
      }
    }

    if (!businessHours || businessHours.length === 0) {
      return false;
    }

    const todayHours = businessHours.find((h) => h.dayOfWeek === dayOfWeek);

    if (todayHours && !todayHours.isClosed && todayHours.opensAt && todayHours.closesAt) {
      const opensAt = todayHours.opensAt;
      const closesAt = todayHours.closesAt;

      if (opensAt < closesAt) {
        if (timeString >= opensAt && timeString < closesAt) {
          return true;
        }
      } else if (opensAt > closesAt) {
        if (timeString >= opensAt) {
          return true;
        }
      }
    }

    const previousDay = dayOfWeek === 1 ? 7 : dayOfWeek - 1;
    const yesterdayHours = businessHours.find((h) => h.dayOfWeek === previousDay);

    if (
      yesterdayHours &&
      !yesterdayHours.isClosed &&
      yesterdayHours.opensAt &&
      yesterdayHours.closesAt
    ) {
      const yOpensAt = yesterdayHours.opensAt;
      const yClosesAt = yesterdayHours.closesAt;

      if (yOpensAt > yClosesAt) {
        if (timeString < yClosesAt) {
          return true;
        }
      }
    }

    return false;
  }
}