import {
  Banknote,
  CreditCard,
  Gift,
  Headphones,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import Link from "next/link";
import {
  FacebookIcon,
  InstagramIcon,
  PinterestIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons";
import type { CategoryNode } from "@/lib/queries";
import { IyzicoBand } from "./payment-logos";
import { type InfoIcon, parseInfoBar, type Settings } from "@/lib/settings";

type FooterPage = { slug: string; title: string; footerGroup: string };

const INFO_ICON_COMPONENTS: Record<InfoIcon, typeof Truck> = {
  shield: ShieldCheck,
  truck: Truck,
  refresh: RotateCcw,
  card: CreditCard,
  headphones: Headphones,
  gift: Gift,
  star: Star,
  lock: Lock,
};

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <h3 className="mb-[15px] text-base font-bold text-black">{title}</h3>}
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
  cardEnabled,
  iyzicoEnabled,
}: {
  settings: Settings;
  menu: CategoryNode[];
  pages: FooterPage[];
  cardEnabled: boolean;
  /** iyzico açıksa markanın istediği logo bandı gösterilir. */
  iyzicoEnabled: boolean;
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
  const categoryLinks = menu.map((c) => ({ href: `/kategori/${c.slug}`, label: c.name }));
  const info = parseInfoBar(settings);
  const socials = [
    { href: settings.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: settings.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: settings.tiktok, label: "TikTok", Icon: TikTokIcon },
    { href: settings.youtube, label: "YouTube", Icon: YouTubeIcon },
    { href: settings.twitter, label: "X (Twitter)", Icon: XIcon },
    { href: settings.pinterest, label: "Pinterest", Icon: PinterestIcon },
  ].filter((s) => s.href);

  return (
    <footer>
      {info.length > 0 && (
        <div className="flex flex-wrap items-center justify-evenly border-t border-line py-2.5">
          {info.map((item, i) => {
            const Icon = INFO_ICON_COMPONENTS[item.icon];
            return (
              <div key={i} className="flex flex-col items-center px-5 py-1.5 text-center">
                <Icon className="mb-1.5 size-9" strokeWidth={1.2} />
                <span className="text-sm">{item.text}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-line">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-8 px-5 py-11 md:grid-cols-4 lg:px-8">
          <FooterColumn title={settings.footerCol1Title}>
            <FooterLinks links={customerLinks} />
          </FooterColumn>
          <FooterColumn title={settings.footerCol2Title}>
            <FooterLinks links={corporateLinks} />
          </FooterColumn>
          <FooterColumn title={settings.footerCol3Title}>
            <FooterLinks links={categoryLinks} />
          </FooterColumn>
          <FooterColumn title={settings.footerCol4Title}>
            <div className="space-y-4 text-[13px] leading-5">
              {settings.workingHours && <p className="whitespace-pre-line">{settings.workingHours}</p>}
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-3">
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
              {socials.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-2">
                  {socials.map(({ href, label, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="transition-opacity hover:opacity-60"
                    >
                      <Icon className="size-5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </FooterColumn>
        </div>
      </div>

      <div className="border-t border-line px-5 py-10 text-center text-[13px]">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          {cardEnabled && (
            <span className="inline-flex items-center gap-2 rounded border border-line px-3 py-1.5">
              <CreditCard className="size-4" /> Kredi / Banka Kartı
            </span>
          )}
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
        {iyzicoEnabled && (
          <div className="mb-8 flex justify-center">
            <IyzicoBand />
          </div>
        )}
        <p>{settings.secureText}</p>
        <p className="mt-1">
          © {new Date().getFullYear()} {settings.storeName} · Tüm Hakları Saklıdır
        </p>
      </div>
    </footer>
  );
}
