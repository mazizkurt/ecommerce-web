"use client";

import Link from "next/link";
import Script from "next/script";
import { useSyncExternalStore } from "react";

const KEY = "cookie-consent";
type Consent = "accepted" | "rejected" | null;

const listeners = new Set<() => void>();
const read = (): Consent => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const setConsent = (v: "accepted" | "rejected") => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // yoksay
  }
  listeners.forEach((l) => l());
};

/**
 * Google Analytics / Meta Pixel yalnızca ziyaretçi çerezlere onay verirse yüklenir (KVKK).
 * Analitik tanımlı değilse hiçbir şey göstermez.
 */
export function CookieConsent({ gaId, pixelId }: { gaId: string; pixelId: string }) {
  const consent = useSyncExternalStore(subscribe, read, () => "rejected" as Consent);
  const ga = /^G-[A-Z0-9]{4,20}$/i.test(gaId) ? gaId : "";
  const pixel = /^\d{6,20}$/.test(pixelId) ? pixelId : "";
  if (!ga && !pixel) return null;

  return (
    <>
      {consent === "accepted" && ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {consent === "accepted" && pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
      {consent === null && (
        <div
          role="dialog"
          aria-label="Çerez tercihi"
          className="fixed inset-x-3 bottom-[72px] z-50 mx-auto max-w-xl rounded border border-line bg-white p-4 text-[13px] shadow-lg lg:bottom-4"
        >
          <p>
            Deneyiminizi iyileştirmek ve site trafiğini analiz etmek için çerezler kullanıyoruz. Detaylar için{" "}
            <Link href="/sayfa/cerez-politikasi" className="underline">
              Çerez Politikası
            </Link>
            &apos;nı inceleyebilirsiniz.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setConsent("rejected")} className="border border-zinc-300 px-4 py-2">
              Reddet
            </button>
            <button type="button" onClick={() => setConsent("accepted")} className="bg-brand px-4 py-2 text-brand-text">
              Kabul Et
            </button>
          </div>
        </div>
      )}
    </>
  );
}
