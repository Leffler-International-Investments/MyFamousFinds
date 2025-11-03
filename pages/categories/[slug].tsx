// FILE: /pages/category/[slug].tsx
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";

export default function CategoryPage() {
  const { query } = useRouter();
  const slug = String(query.slug || "");
  return (
    <>
      <Head><title>{slug} – Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1 style={{letterSpacing:".14em"}}>{slug.toUpperCase()}</h1>
        <p className="hint">Demo listing for “{slug}”.</p>
        <section className="grid">
          {[...Array(8)].map((_,i)=>(
            <ProductCard
              key={i}
              id={`${slug}-${i}`}
              title={`${slug} item ${i+1}`}
              brand="Famous"
              price={`$${(100+i)*10}`}
              image="/demo/gucci-bag-1.jpg"
              href={`/product/${slug}-${i}`}
              details="Demo item, tap to view."
            />
          ))}
        </section>
      </main>
      <Footer />
      <style jsx>{`
        .wrap{ max-width:1200px; margin:0 auto; padding:24px 16px; }
        .hint{ color:#aaa; margin:8px 0 18px; }
        .grid{ display:grid; gap:12px; grid-template-columns:repeat(5,1fr); }
        @media (max-width:1100px){ .grid{ grid-template-columns:repeat(4,1fr);} }
        @media (max-width:900px){ .grid{ grid-template-columns:repeat(3,1fr);} }
        @media (max-width:640px){ .grid{ grid-template-columns:repeat(2,1fr);} }
      `}</style>
    </>
  );
}
