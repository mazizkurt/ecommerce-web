import { AnnouncementBar } from "@/components/shop/announcement-bar";
import { CartUIProvider } from "@/components/shop/cart-ui";
import { MobileBottomNav, WhatsAppButton } from "@/components/shop/floating";
import { Footer } from "@/components/shop/footer";
import { Header } from "@/components/shop/header";
import { getFooterPages, getMenuTree } from "@/lib/queries";
import { getSettings, pricingFrom } from "@/lib/settings";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, menu, pages] = await Promise.all([
    getSettings(),
    getMenuTree(),
    getFooterPages(),
  ]);

  return (
    <CartUIProvider pricing={pricingFrom(settings)}>
      <AnnouncementBar
        text={settings.announcement}
        link={settings.announcementLink}
      />
      <Header menu={menu} logoText={settings.logoText} whatsapp={settings.whatsapp} />
      <main className="flex-1">{children}</main>
      <div className="pb-[60px] lg:pb-0">
        <Footer settings={settings} menu={menu} pages={pages} />
      </div>
      <WhatsAppButton phone={settings.whatsapp} />
      <MobileBottomNav />
    </CartUIProvider>
  );
}
