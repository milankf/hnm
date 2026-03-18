"use client";

import dynamic from "next/dynamic";

const WeddingPage = dynamic(
  () => import("@/components/wedding-page").then((m) => ({ default: m.WeddingPage })),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-background" />,
  }
);

type WeddingPageClientProps = {
  initialSlug?: string;
};

export function WeddingPageClient({ initialSlug }: WeddingPageClientProps) {
  return <WeddingPage initialSlug={initialSlug} />;
}
