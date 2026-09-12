import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shop/sections";
import { getPageBySlug } from "@/lib/queries";

export async function generateMetadata({
  params,
}: PageProps<"/sayfa/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  return { title: page?.title ?? "Sayfa bulunamadı" };
}

/** Basit içerik biçimi: boş satır = yeni paragraf, "## " ile başlayan satır = başlık. */
function renderContent(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, i) =>
      block.startsWith("## ") ? (
        <h2 key={i}>{block.slice(3)}</h2>
      ) : (
        <p key={i} className="whitespace-pre-line">
          {block}
        </p>
      ),
    );
}

export default async function ContentPage({ params }: PageProps<"/sayfa/[slug]">) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: page.title }]} />
      <h1 className="mb-6 text-2xl">{page.title}</h1>
      <div className="prose-content text-sm text-[#222]">{renderContent(page.content)}</div>
    </div>
  );
}
