import type { Metadata } from "next";
import { Bodoni_Moda, Josefin_Sans, Roboto } from "next/font/google";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "700"],
});

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin", "latin-ext"],
});

const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: {
      default: `${s.storeName} | ${s.tagline}`,
      template: `%s | ${s.storeName}`,
    },
    description: s.metaDescription,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${roboto.variable} ${bodoni.variable} ${josefin.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
