import type { Metadata } from "next";
import {
  Bodoni_Moda,
  Cinzel,
  Cormorant_Garamond,
  Inter,
  Josefin_Sans,
  Montserrat,
  Playfair_Display,
  Poppins,
  Roboto,
} from "next/font/google";
import { getSettings, siteUrlFrom, themeCss } from "@/lib/settings";
import "./globals.css";


// Varsayılanlar önceden yüklenir; panelden seçilebilen diğer yazı tipleri sadece kullanılınca iner.
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "700"],
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], preload: false });
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  preload: false,
});
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
});
const bodoni = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin", "latin-ext"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  preload: false,
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  preload: false,
});
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin", "latin-ext"], preload: false });
const josefin = Josefin_Sans({ variable: "--font-josefin", subsets: ["latin", "latin-ext"] });

const fontVariables = [
  roboto,
  inter,
  montserrat,
  poppins,
  bodoni,
  playfair,
  cormorant,
  cinzel,
  josefin,
]
  .map((f) => f.variable)
  .join(" ");

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  let metadataBase: URL | undefined;
  try {
    metadataBase = new URL(siteUrlFrom(s));
  } catch {
    metadataBase = undefined;
  }
  const icon = s.faviconUrl || "/site-icon";
  return {
    metadataBase,
    title: {
      default: `${s.storeName} | ${s.tagline}`,
      template: `%s | ${s.storeName}`,
    },
    description: s.metaDescription,
    icons: { icon, apple: icon },
    openGraph: {
      siteName: s.storeName,
      type: "website",
      locale: "tr_TR",
      images: s.ogImageUrl ? [s.ogImageUrl] : undefined,
    },
    verification: s.googleSiteVerification
      ? { google: s.googleSiteVerification }
      : undefined,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <html lang="tr" className={`${fontVariables} h-full antialiased`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss(settings) }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
