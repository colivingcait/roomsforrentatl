import unitsData from "@/data/units.json";
import type { Unit } from "./types";

const UNITS = (unitsData.units as Unit[]) ?? [];

/** Available soonest first, then cheaper first. */
export function getUnits(): Unit[] {
  return [...UNITS].sort((a, b) => {
    const ad = a.availableDate ?? "9999";
    const bd = b.availableDate ?? "9999";
    if (ad !== bd) return ad < bd ? -1 : 1;
    return a.rent - b.rent;
  });
}

export function getUnit(id: string): Unit | null {
  return UNITS.find((u) => u.id === id) ?? null;
}

export function getAllUnitIds(): string[] {
  return UNITS.map((u) => u.id);
}
