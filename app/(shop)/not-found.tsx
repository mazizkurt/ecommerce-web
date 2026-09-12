import Link from "next/link";

export default function ShopNotFound() {
  return (
    <div className="flex flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-7xl font-extralight">404</p>
      <h1 className="mt-4 text-xl">Aradığınız sayfa bulunamadı</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Ürün satıştan kaldırılmış veya adres değişmiş olabilir.
      </p>
      <Link href="/" className="mt-8 bg-black px-8 py-3 text-sm font-medium text-white">
        ANASAYFAYA DÖN
      </Link>
    </div>
  );
}
