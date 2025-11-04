// /pages/category/[slug].tsx
import { useRouter } from "next/router";
import Link from "next/link";

export default function CategoryPage() {
  const { slug } = useRouter().query;
  const category = String(slug || "").toUpperCase();

  return (
    <div className="min-h-screen bg-black text-gray-100 px-6 py-10">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-200">
        ← Back to Dashboard
      </Link>

      <div className="mt-6 text-center">
        <h1 className="text-2xl font-bold">{category || "CATEGORY"}</h1>
        <p className="text-gray-400 mt-2">Curated luxury items under {category}</p>

        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} className="border border-neutral-800 rounded-xl p-4 bg-neutral-950 text-center">
              <div className="aspect-square bg-neutral-900 rounded-md mb-3"></div>
              <p className="font-medium">Sample Item #{i+1}</p>
              <p className="text-sm text-gray-400">$ {(100+i*20).toFixed(0)}</p>
              <button className="mt-2 bg-white text-black text-xs font-medium px-3 py-1 rounded-full">
                View Item
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
