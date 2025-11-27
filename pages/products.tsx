// FILE: pages/products.tsx

import Head from "next/head";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard, { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";

// ------------ helpers ------------
const formatPrice = (raw: any): string => {
  const num = typeof raw === "number" ? raw : Number(raw || 0);
  if (!num) return "";
  return `US$${num.toLocaleString()}`;
};

const pickImage = (data: any): string => {
  if (data.image_url) return data.image_url;
  if (data.imageUrl) return data.imageUrl;
  if (data.image) return data.image;
  if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
    return data.imageUrls[0];
  }
  return "";
};

// ------------ types ------------
type Props = {
  items: ProductLike[];
  designer: string | null;
  tag: string | null;
};

// ------------ page component ------------
const ProductsPage: NextPage<Props> = ({ items, designer, tag }) => {
  const grouped: Record<string, ProductLike[]> = {};

  items.forEach((item: any) => {
    const cat =
      item.category || item.categoryName || item.department || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const pageTitle = designer || tag || "All Designer Pieces";

  return (
    <>
      <Head>
        <title>{pageTitle} | Famous Finds</title>
      </Head>
      <Header />

      {/* centered layout like homepage */}
      <main className="wrap py-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          {designer ? designer : tag ? `${tag} pieces` : "All Designer Pieces"}
        </h1>

        {designer && (
          <p className="text-sm text-gray-500 mb-6">
            Showing all live listings for <strong>{designer}</strong>, grouped
            by category.
          </p>
        )}

        {Object.keys(grouped).length === 0 && (
          <p className="text-sm text-gray-500">No items found.</p>
        )}

        {Object.entries(grouped).map(([category, catItems]) => (
          <section key={category} className="mb-12">
            <h2 className="text-xl font-medium mb-4 capitalize">{category}</h2>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {catItems.map((item) => (
                <ProductCard key={item.id} {...item} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <Footer />
    </>
  );
};

export default ProductsPage;

// ------------ server-side data ------------
export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const { designer: rawDesigner, tag: rawTag } = context.query;

  const designer =
    typeof rawDesigner === "string" && rawDesigner.length > 0
      ? rawDesigner
      : null;
  const tag =
    typeof rawTag === "string" && rawTag.length > 0 ? rawTag : null;

  const snapshot = await adminDb
    .collection("listings")
    .where("status", "==", "Live")
    .get();

  let items: ProductLike[] = snapshot.docs.map((doc) => {
    const data = doc.data() as any;

    return {
      id: doc.id,
      title: data.title || "",
      brand: data.brand || "",
      price: formatPrice(data.price),
      image: pickImage(data),
      href: `/product/${doc.id}`,
      category: data.category || "",
      condition: data.condition || "",
      badge: data.condition || "",
      tags: data.tags || [],
    };
  });

  // filter by designer
  if (designer) {
    items = items.filter((item: any) => (item.brand || "").trim() === designer);
  }

  // filter by tag
  if (tag) {
    items = items.filter((item: any) =>
      Array.isArray(item.tags) ? item.tags.includes(tag) : false
    );
  }

  return {
    props: {
      items,
      designer,
      tag,
    },
  };
};
