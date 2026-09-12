import { cache } from "react";
import { db } from "./db";
import { settings as settingsTable } from "./db/schema";
import { DEFAULT_SETTINGS, SECRET_KEYS, type SettingKey, type Settings } from "./settings-shared";

export * from "./settings-shared";

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.select().from(settingsTable);
  const merged: Settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in merged) merged[row.key as SettingKey] = row.value;
  }
  return merged;
});

/** Gizli değerleri boşaltır; panel formuna yalnızca "kayıtlı mı" bilgisi gider. */
export function redactSettings(s: Settings) {
  const safe: Settings = { ...s };
  const secretsSet: Partial<Record<SettingKey, boolean>> = {};
  for (const key of SECRET_KEYS) {
    secretsSet[key] = !!s[key];
    safe[key] = "";
  }
  return { settings: safe, secretsSet };
}
