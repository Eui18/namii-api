export interface BusinessHours {
  id?: number;
  establishmentId: number;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
}