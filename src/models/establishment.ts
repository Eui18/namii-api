export const ESTABLISHMENT_CATEGORIES = [
  "RESTAURANTES",
  "CAFETERIAS",
  "TAQUERIAS",
  "PANADERIAS",
  "REPOSTERIAS",
  "PIZZERIAS",
  "FONDAS",
  "COMIDA_RAPIDA",
  "BEBIDAS",
  "POSTRES"
] as const;

export type EstablishmentCategory = (typeof ESTABLISHMENT_CATEGORIES)[number];

export type ManualStatus = "OPEN" | "CLOSED";

export interface Establishment {
  id: number;
  ownerId: number;
  name: string;
  category: EstablishmentCategory;
  description: string | null;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  coverPhotoUrl: string | null;
  manualStatus: ManualStatus | null;
  manualStatusDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}