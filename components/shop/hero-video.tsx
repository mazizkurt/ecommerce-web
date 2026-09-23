"use client";

import { useEffect, useRef } from "react";

/**
 * Hero videosu. Safari/iOS otomatik oynatma konusunda katıdır:
 * - video sessiz olmalı (öznitelik + özellik olarak ayarlanır),
 * - satır içi oynatılmalı (playsInline),
 * - görünmeyen slayttaki videolar duraklatılır (iOS aynı anda birden çok videoda takılır),
 * - ilk deneme reddedilirse (Düşük Güç Modu vb.) hazır olunca ve ilk dokunuşta yeniden denenir.
 * Hiç oynatılamazsa poster görseli görünmeye devam eder.
 */
export function HeroVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // Safari yalnızca gerçekten sessiz videoları otomatik oynatır.
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    // Slayt gizliyken (HeroSlider aria-hidden veriyor) oynatma.
    // closest() elemanın kendisini de sayar; video aria-hidden taşıdığı için üst öğeden aranır.
    const slide = video.parentElement?.closest("[aria-hidden]") ?? null;
    const hidden = () => slide?.getAttribute("aria-hidden") === "true" || document.hidden;

    let stopped = false;
    const play = () => {
      if (stopped || hidden()) return;
      video.play().catch(() => {
        // Otomatik oynatma engellendi: poster görünmeye devam eder, ilk dokunuşta tekrar denenir.
      });
    };
    const sync = () => (hidden() ? video.pause() : play());

    play();
    for (const event of ["loadeddata", "canplay", "stalled"]) {
      video.addEventListener(event, play);
    }
    document.addEventListener("visibilitychange", sync);
    // Kullanıcı etkileşimi otomatik oynatma kısıtını kaldırır.
    for (const event of ["touchstart", "pointerdown", "scroll"]) {
      window.addEventListener(event, play, { passive: true });
    }
    const observer = slide ? new MutationObserver(sync) : null;
    if (slide && observer) observer.observe(slide, { attributes: true, attributeFilter: ["aria-hidden"] });

    return () => {
      stopped = true;
      for (const event of ["loadeddata", "canplay", "stalled"]) {
        video.removeEventListener(event, play);
      }
      document.removeEventListener("visibilitychange", sync);
      for (const event of ["touchstart", "pointerdown", "scroll"]) {
        window.removeEventListener(event, play);
      }
      observer?.disconnect();
    };
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      className={className}
    />
  );
}
