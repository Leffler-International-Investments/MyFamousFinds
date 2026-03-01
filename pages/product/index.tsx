// FILE: pages/products/index.tsx

import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

type Props = {
  items: ProductLike[];
};

export default function ProductsPage({ items }: Props) {
  const router = useRouter();
  const { designer } = router.query;

  const selectedDesigner =
    typeof designer === "string" && designer.length > 0 ? designer : undefined;

  const groupedByCategory = useMemo(() => {
    const filtered = selectedDesigner
      ? items.filter((item: any) => {
          const itemDesigner =
            (item as any).designer ||
            (item as any).designerName ||
            (item as any).brand ||
            "";
          return itemDesigner === selectedDesigner;
        })
      : items;

    const groups: Record<string, ProductLike[]> = {};

    filtered.forEach((item: any) => {
      const cat =
        (item as any).category ||
        (item as any).categoryName ||
        (item as any).department ||
        "Other";

      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    return groups;
  }, [items, selectedDesigner]);

  const pageTitle = selectedDesigner
    ? `${selectedDesigner} – Designer Pieces | Famous Finds`
    : "All Designer Pieces | Famous Finds";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            {selectedDesigner ? selectedDesigner : "All Designer Pieces"}
          </h1>
          {selectedDesigner && (
            <p className="text-sm text-gray-500">
              Showing all authenticated pieces saved under{" "}
              <span className="font-medium">{selectedDesigner}</span>, grouped
              by category.
            </p>
          )}
        </div>

        {Object.keys(groupedByCategory).length === 0 && (
          <p className="text-sm text-gray-500">
            No pieces found for this designer yet.
          </p>
        )}

        {Object.entries(groupedByCategory).map(([category, catItems]) => (
          <section key={category} className="mb-10">
            <h2 className="text-xl font-medium mb-4">{category}</h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {catItems.map((item: ProductLike) => (
                <ProductCard key={item.id} {...item} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (!adminDb) {
    return { props: { items: [] } };
  }

  const snapshot = await adminDb.collection("listings").get();

  const items: ProductLike[] = snapshot.docs.map((doc) => {
    const data = doc.data() as any;

    // Extract first available image
    const images = data.displayImageUrls || data.images || data.imageUrls || [];
    const image =
      (typeof data.displayImageUrl === "string" && data.displayImageUrl) ||
      (Array.isArray(images) && images.length > 0 ? images[0] : "") ||
      "";

    // Format price as display string
    const rawPrice = Number(data.priceUsd || data.price || 0);
    const price = rawPrice
      ? `$${rawPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
      : undefined;

    return {
      id: doc.id,
      title: String(data.title || data.name || "Untitled"),
      brand: String(data.brand || data.designer || "").trim() || undefined,
      price,
      image,
      href: `/product/${doc.id}`,
      category: String(data.category || "").trim() || undefined,
      condition: String(data.condition || "").trim() || undefined,
    };
  });

  return {
    props: {
      items: JSON.parse(JSON.stringify(items)),
    },
  };
};
