import { WeddingPageClient } from "../wedding-page-client";

type SlugPageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export default async function SlugPage({ params }: SlugPageProps) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);

  return <WeddingPageClient initialSlug={slug} />;
}
