export const TIME_WINDOW_MINUTES = 30 as const;
export const TIME_WINDOW_MS = TIME_WINDOW_MINUTES * 60 * 1000;

export function floorToWindow(value: string | Date): string {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid observation timestamp");
  }
  date.setUTCMinutes(Math.floor(date.getUTCMinutes() / TIME_WINDOW_MINUTES) * TIME_WINDOW_MINUTES, 0, 0);
  return date.toISOString();
}

export function windowEnd(windowStart: string): string {
  return new Date(new Date(windowStart).getTime() + TIME_WINDOW_MS).toISOString();
}
