import { cn } from "@/lib/cn";

/**
 * iyzico marka varlıkları. Dosyalar iyzico'nun gönderdiği paketten, değiştirilmeden
 * kullanılır (public/iyzico-logo-pack). Açık zeminde renkli sürüm kullanılmalıdır.
 */
const BAND = "/iyzico-logo-pack/footer_iyzico_ile_ode/Colored/logo_band_colored.svg";
const PAY_BADGE =
  "/iyzico-logo-pack/checkout_iyzico_ile_ode/TR/Tr_Colored_Horizontal/iyzico_ile_ode_colored_horizontal.svg";

/** Footer'da gösterilen iyzico + kart markaları bandı. */
export function IyzicoBand({ className }: { className?: string }) {
  return (
    // Statik SVG; next/image SVG'yi optimize etmiyor.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BAND}
      alt="iyzico ile güvenli ödeme: Visa, Mastercard, Troy, American Express"
      width={429}
      height={32}
      className={cn("h-8 w-auto max-w-full", className)}
    />
  );
}

/** Ödeme sayfasında kredi kartı seçeneğinin yanındaki "iyzico ile öde" rozeti. */
export function IyzicoPayBadge({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PAY_BADGE}
      alt="iyzico ile öde"
      width={210}
      height={31}
      className={cn("h-[22px] w-auto", className)}
    />
  );
}
