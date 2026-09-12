import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-extralight">404</p>
      <h1 className="mt-4 text-xl">Aradığınız sayfa bulunamadı</h1>
      <Link href="/" className="mt-8 bg-black px-8 py-3 text-sm font-medium text-white">
        ANASAYFAYA DÖN
      </Link>
    </div>
  );
}
