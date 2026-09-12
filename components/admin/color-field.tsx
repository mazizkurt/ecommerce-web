"use client";

import { useState } from "react";
import { inputBase } from "./ui";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Renk seçici + #RRGGBB metin girişi (aynı değeri paylaşır). */
export function ColorField({
  name,
  defaultValue,
  resetTo,
  allowEmpty,
}: {
  name: string;
  defaultValue: string;
  resetTo?: string;
  allowEmpty?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="color"
        value={HEX.test(value) ? value : "#000000"}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Renk seç"
        className="h-10 w-12 cursor-pointer rounded-md border border-zinc-300 bg-white p-1"
      />
      <input
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value.trim())}
        placeholder={allowEmpty ? "Renk yok" : "#000000"}
        className={`${inputBase} w-28 font-mono uppercase`}
      />
      {resetTo && value.toLowerCase() !== resetTo.toLowerCase() && (
        <button type="button" onClick={() => setValue(resetTo)} className="text-xs text-zinc-500 underline">
          Varsayılan
        </button>
      )}
      {allowEmpty && value && (
        <button type="button" onClick={() => setValue("")} className="text-xs text-zinc-500 underline">
          Temizle
        </button>
      )}
    </div>
  );
}
