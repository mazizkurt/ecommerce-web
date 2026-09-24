import type { Metadata } from "next";
import { FavoritesList } from "@/components/shop/favorites-list";

export const metadata: Metadata = { title: "Favorilerim", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="pb-10">
      <h1 className="px-[22px] py-6 text-2xl">Favorilerim</h1>
      <FavoritesList />
    </div>
  );
}
