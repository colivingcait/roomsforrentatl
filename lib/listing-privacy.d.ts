declare module "./listing-privacy.mjs" {
  export function isStreetishPlace(value: string | null | undefined): boolean;
  export function leakReason(value: string | null | undefined): string | null;
  export function roundCoord<T>(value: T): T;
  export function dropPhoto(photo: {
    url?: string;
    location?: string;
    category?: string;
    description?: string | null;
    label?: string | null;
  }): boolean;
  export function publicPhoto(photo: {
    url?: string;
    location?: string;
    category?: string;
    description?: string | null;
    label?: string | null;
    primary?: boolean;
    width?: number | null;
    height?: number | null;
  }): {
    url: string;
    category: string;
    label: string;
    primary?: boolean;
    width?: number;
    height?: number;
  } | null;
  export function publicRoom(
    room: Record<string, unknown>,
    dropped?: Set<string>
  ): import("./types").Room;
  export function publicNeighborhood(live?: string | null, seed?: string | null): string;
  export function publicImage(url: string | null | undefined, dropped?: Set<string>): string | undefined;
}

declare module "@/lib/listing-privacy.mjs" {
  export function isStreetishPlace(value: string | null | undefined): boolean;
  export function leakReason(value: string | null | undefined): string | null;
  export function roundCoord<T>(value: T): T;
  export function dropPhoto(photo: {
    url?: string;
    location?: string;
    category?: string;
    description?: string | null;
    label?: string | null;
  }): boolean;
  export function publicPhoto(photo: {
    url?: string;
    location?: string;
    category?: string;
    description?: string | null;
    label?: string | null;
    primary?: boolean;
    width?: number | null;
    height?: number | null;
  }): {
    url: string;
    category: string;
    label: string;
    primary?: boolean;
    width?: number;
    height?: number;
  } | null;
  export function publicRoom(
    room: Record<string, unknown>,
    dropped?: Set<string>
  ): import("./types").Room;
  export function publicNeighborhood(live?: string | null, seed?: string | null): string;
  export function publicImage(url: string | null | undefined, dropped?: Set<string>): string | undefined;
}
