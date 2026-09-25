import { AnnouncementBar } from "@/components/shop/announcement-bar";
import { CartUIProvider } from "@/components/shop/cart-ui";
import { CookieConsent } from "@/components/shop/cookie-consent";
import { MobileBottomNav, WhatsAppButton } from "@/components/shop/floating";
import { Footer } from "@/components/shop/footer";
import { Header } from "@/components/shop/header";
import { getEnabledProviders } from "@/lib/payments";
import { getFooterPages, getMenuTree } from "@/lib/queries";
import { getSettings, pricingFrom } from "@/lib/settings";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, menu, pages, providers] = await Promise.all([
    getSettings(),
    getMenuTree(),
    getFooterPages(),
    getEnabledProviders(),
  ]);

  return (
    <CartUIProvider pricing={pricingFrom(settings)} cartPriceLabel={settings.cartPriceLabel}>
      <AnnouncementBar text={settings.announcement} link={settings.announcementLink} />
      <Header
        menu={menu}
        branding={{
          logoText: settings.logoText,
          logoUrl: settings.logoUrl,
          logoHeight: Number(settings.logoHeight) || 44,
        }}
        whatsapp={settings.whatsapp}
        instagram={settings.instagram}
      />
      <main className="flex-1">{children}</main>
      <div className="pb-[60px] lg:pb-0">
        <Footer
          settings={settings}
          menu={menu}
          pages={pages}
          cardEnabled={providers.length > 0}
          iyzicoEnabled={settings.showIyzicoLogo === "1"}
        />
      </div>
      <WhatsAppButton phone={settings.whatsapp} />
      <MobileBottomNav />
      <CookieConsent gaId={settings.googleAnalyticsId} pixelId={settings.metaPixelId} />
    </CartUIProvider>
  );
}
