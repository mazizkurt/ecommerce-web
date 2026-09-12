import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/settings";

/** Panelden favicon yüklenmediğinde logo yazısının baş harfinden ikon üretir. */
export async function GET() {
  const s = await getSettings();
  const letter = (s.logoText || s.storeName || "E").trim().charAt(0).toLocaleUpperCase("tr-TR");
  const bg = /^#[0-9a-fA-F]{6}$/.test(s.colorPrimary) ? s.colorPrimary : "#000000";
  const fg = /^#[0-9a-fA-F]{6}$/.test(s.colorPrimaryText) ? s.colorPrimaryText : "#ffffff";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          color: fg,
          fontSize: 132,
          fontFamily: "serif",
        }}
      >
        {letter}
      </div>
    ),
    { width: 192, height: 192, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
