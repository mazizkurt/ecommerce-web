import { Banknote, Headphones, Mail, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { InstagramIcon } from "@/components/icons";
import type { CategoryNode } from "@/lib/queries";
import type { Settings } from "@/lib/settings";

type FooterPage = { slug: string; title: string; footerGroup: string };

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-[15px] text-base font-bold text-black">{title}</h3>
      {children}
    </div>
  );
}

function FooterLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <ul>
      {links.map((l) => (
        <li key={l.href} className="py-[3px]">
          <Link href={l.href} className="block text-[13px] leading-[25px] hover:underline">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer({
  settings,
  menu,
  pages,
}: {
  settings: Settings;
  menu: CategoryNode[];
  pages: FooterPage[];
}) {
  const customerLinks = [
    ...pages
      .filter((p) => p.footerGroup === "musteri")
      .map((p) => ({ href: `/sayfa/${p.slug}`, label: p.title })),
    { href: "/siparis-takip", label: "Sipariş Takip" },
  ];
  const corporateLinks = pages
    .filter((p) => p.footerGroup === "kurumsal")
    .map((p) => ({ href: `/sayfa/${p.slug}`, label: p.title }));
  const categoryLinks = menu.map((c) => ({
    href: `/kategori/${c.slug}`,
    label: c.name,
  }));

  return (
    <footer>
      <div className="flex items-center justify-evenly border-t border-line py-2.5">
        <div className="flex flex-col items-center px-5 py-1.5">
          <ShieldCheck className="mb-1.5 size-9" strokeWidth={1.2} />
          <span className="text-sm">Güvenli Alışveriş</span>
        </div>
        <div className="flex flex-col items-center px-5 py-1.5">
          <Truck className="mb-1.5 size-9" strokeWidth={1.2} />
          <span className="text-sm">HIZLI TESLİMAT</span>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-8 px-5 py-11 md:grid-cols-4 lg:px-8">
          <FooterColumn title="Müşteri Hizmetleri">
            <FooterLinks links={customerLinks} />
          </FooterColumn>
          <FooterColumn title="Kurumsal">
            <FooterLinks links={corporateLinks} />
          </FooterColumn>
          <FooterColumn title="Kategoriler">
            <FooterLinks links={categoryLinks} />
          </FooterColumn>
          <FooterColumn title="Bize Ulaşın">
            <div className="space-y-4 text-[13px] leading-5">
              {settings.workingHours && (
                <p className="whitespace-pre-line">{settings.workingHours}</p>
              )}
              {settings.phone && (
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3"
                >
                  <Headphones className="size-4" />
                  {settings.phone}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-3">
                  <Mail className="size-4" />
                  {settings.email}
                </a>
              )}
              {settings.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-block pt-2"
                >
                  <InstagramIcon className="size-5" />
                </a>
              )}
            </div>
          </FooterColumn>
        </div>
      </div>

      <div className="border-t border-line px-5 py-10 text-center text-[13px]">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          {settings.paymentBankTransfer === "1" && (
            <span className="inline-flex items-center gap-2 rounded border border-line px-3 py-1.5">
              <Banknote className="size-4" /> Havale / EFT
            </span>
          )}
          {settings.paymentCashOnDelivery === "1" && (
            <span className="inline-flex items-center gap-2 rounded border border-line px-3 py-1.5">
              <Truck className="size-4" /> Kapıda Ödeme
            </span>
          )}
        </div>
        <p>{settings.secureText}</p>
        <p className="mt-1">
          © {new Date().getFullYear()} {settings.storeName} · Tüm Hakları Saklıdır
        </p>
      </div>
    </footer>
  );
}
