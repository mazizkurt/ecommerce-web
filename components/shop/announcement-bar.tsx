import Link from "next/link";

export function AnnouncementBar({ text, link }: { text: string; link: string }) {
  if (!text) return null;
  const group = (
    <div className="flex shrink-0" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="whitespace-nowrap px-[22px]">
          {text}
        </span>
      ))}
    </div>
  );
  return (
    <div className="h-10 overflow-hidden bg-black text-sm text-white lg:text-base">
      <Link
        href={link || "/"}
        className="flex h-full w-max animate-marquee items-center hover:[animation-play-state:paused]"
      >
        <span className="sr-only">{text}</span>
        {group}
        {group}
      </Link>
    </div>
  );
}
