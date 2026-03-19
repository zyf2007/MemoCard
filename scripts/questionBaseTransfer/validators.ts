import { RawRecord } from "./types";

export function ensureRecord(value: unknown, errorMessage: string): RawRecord {
  if (typeof value !== "object" || value === null) {
    throw new Error(errorMessage);
  }
  return value as RawRecord;
}

export function ensureNonEmptyString(value: unknown, errorMessage: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(errorMessage);
  }
  return value.trim();
}
