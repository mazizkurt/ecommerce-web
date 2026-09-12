"use client";

import { Printer } from "lucide-react";
import { btnSecondary } from "./ui";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={btnSecondary}>
      <Printer className="size-4" /> Yazdır
    </button>
  );
}
