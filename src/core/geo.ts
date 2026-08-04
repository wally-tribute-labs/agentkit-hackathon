import { gridDisk, latLngToCell } from "h3-js";

export const H3_RESOLUTION = 8 as const;
export const H3_EDGE_LENGTH_METERS = 531;

export function coordinatesToCell(latitude: number, longitude: number): string {
  return latLngToCell(latitude, longitude, H3_RESOLUTION);
}

export function cellsForRadius(latitude: number, longitude: number, radiusMeters: number): string[] {
  const center = coordinatesToCell(latitude, longitude);
  const rings = Math.max(0, Math.ceil(radiusMeters / (H3_EDGE_LENGTH_METERS * 2)));
  return gridDisk(center, rings);
}
