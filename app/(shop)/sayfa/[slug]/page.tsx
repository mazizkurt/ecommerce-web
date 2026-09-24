import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { excerpt } from "@/components/shop/json-ld";
import { PageContent } from "@/components/shop/page-content";
import { Breadcrumb } from "@/components/shop/sections";
import { getPageBySlug } from "@/lib/queries";

export async function generateMetadata({
  params,
}: PageProps<"/sayfa/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Sayfa bulunamadı" };
  return {
    title: page.title,
    description: excerpt(page.content) || undefined,
    alternates: { canonical: `/sayfa/${page.slug}` },
  };
}

export default async function ContentPage({ params }: PageProps<"/sayfa/[slug]">) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: page.title }]} />
      <h1 className="mb-6 text-2xl">{page.title}</h1>
      <div className="prose-content text-sm text-[#222]">
        <PageContent content={page.content} />
      </div>
    </div>
  );
}
