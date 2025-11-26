// FILE: /pages/designers/index.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";

type Designer = {
  id: string;
  name: string;
  slug: string;
  itemTypes?: string;
  image?: string; // Representative image for featured section
};

type DesignersPageProps = {
  featuredDesigners: Designer[];
  groupedDesigners: Record<string, Designer[]>;
  allKeys: string[]; // ["A", "B", "C"...]
};

export default function DesignersIndexPage({
  featuredDesigners,
  groupedDesigners,
  allKeys,
}: DesignersPageProps) {
  // Simple active state for the sticky nav
  const [activeLetter, setActiveLetter] = useState("");

  return (
    <div className="bg-white min-h-screen text-neutral-900">
      <Head>
        <title>Designers Directory – Famous Finds</title>
      </Head>

      <Header />

      <main className="pb-24">
        {/* --- HERO / FEATURED SECTION --- */}
        <section className="bg-[#F9F9F7] px-6 py-12 md:py-16">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-10 text-center">
              <h1 className="font-serif text-3xl md:text-5xl text-neutral-900 mb-4">
                Featured Designers
              </h1>
              <p className="text-neutral-500 max-w-2xl mx-auto">
                Discover the world's most coveted luxury brands, authenticated and ready for a second life.
              </p>
            </div>

            {/* Featured Grid with Background Images */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featuredDesigners.map((d) => (
                <Link
                  key={d.id}
                  href={`/designers/${d.slug || d.id}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-200"
                >
                  {/* Background Image */}
                  {d.image ? (
                    <img
                      src={d.image}
                      alt={d.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-300" />
                  )}

                  {/* Dark Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  
                  {/* Gradient at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* Designer Name */}
                  <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                    <span className="font-serif text-lg md:text-xl font-medium text-white tracking-wide">
                      {d.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* --- A-Z STICKY NAVIGATION --- */}
        <div className="sticky top-0 z-40 border-b border-t border-neutral-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:justify-center md:gap-6 overflow-x-auto no-scrollbar">
            {allKeys.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="font-medium text-neutral-500 hover:text-black hover:underline px-2 py-1 transition-colors text-sm md:text-base whitespace-nowrap"
              >
                {letter}
              </a>
            ))}
          </div>
        </div>

        {/* --- A-Z DIRECTORY LIST --- */}
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          {allKeys.length === 0 ? (
            <p className="text-center text-neutral-500">No designers found.</p>
          ) : (
            <div className="space-y-16">
              {allKeys.map((letter) => (
                <div
                  key={letter}
                  id={`letter-${letter}`}
                  className="scroll-mt-24" // Offset for sticky header
                >
                  <div className="flex flex-col md:flex-row gap-8 md:gap-24">
                    {/* Big Letter Heading */}
                    <div className="md:w-32 flex-shrink-0">
                      <span className="block text-6xl font-serif text-neutral-200 font-bold">
                        {letter}
                      </span>
                    </div>

                    {/* List of Designers for this letter */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4 flex-1">
                      {groupedDesigners[letter].map((d) => (
                        <Link
                          key={d.id}
                          href={`/designers/${d.slug || d.id}`}
                          className="text-neutral-600 hover:text-black hover:underline transition-colors text-sm md:text-base"
                        >
                          {d.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="mt-12 h-px w-full bg-neutral-100" />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<DesignersPageProps> = async () => {
  try {
    // 1. Fetch all designers
    const snap = await adminDb.collection("designers").get();
    
    let designers: Designer[] = snap.docs
      .map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          name: data.name || doc.id,
          slug: data.slug || doc.id,
          itemTypes: data.itemTypes || "",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // 2. Define the "Featured" list (Top Luxury Brands)
    // You can adjust this list to match your inventory
    const featuredNames = [
      "Chanel",
      "Louis Vuitton",
      "Hermès",
      "Gucci",
      "Prada",
      "Dior",
      "Saint Laurent",
      "Fendi",
      "Cartier",
      "Rolex",
      "Burberry",
      "Balenciaga"
    ];

    // 3. Separate Featured vs Regular & fetch images for featured
    const featuredDesigners: Designer[] = [];
    
    // We want to find the designers in our DB that match the featured list
    for (const name of featuredNames) {
      const found = designers.find(d => 
        d.name.toLowerCase() === name.toLowerCase()
      );
      
      if (found) {
        // Try to find ONE listing image for this designer to use as background
        // We look in 'listings' collection where designer == name
        let bgImage = "";
        try {
          const productSnap = await adminDb.collection("listings")
            .where("designer", "==", found.name) // Make sure casing matches in your DB
            .where("status", "in", ["Live", "Active"]) // Only show images from live items
            .limit(1)
            .get();
          
          if (!productSnap.empty) {
            const pData = productSnap.docs[0].data();
             bgImage =
                pData.image_url ||
                pData.imageUrl ||
                pData.image ||
                (Array.isArray(pData.imageUrls) && pData.imageUrls[0]) ||
                "";
          }
        } catch (e) {
          // ignore error, just no image
        }

        featuredDesigners.push({
          ...found,
          image: bgImage // will be empty string if not found, UI handles that
        });
      }
    }

    // 4. Group ALL designers by First Letter for the Directory
    const groupedDesigners: Record<string, Designer[]> = {};
    
    designers.forEach((d) => {
      // Get first char, handle numeric/special
      const firstChar = d.name.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : "#";
      
      if (!groupedDesigners[key]) {
        groupedDesigners[key] = [];
      }
      groupedDesigners[key].push(d);
    });

    const allKeys = Object.keys(groupedDesigners).sort();

    return { 
      props: { 
        featuredDesigners,
        groupedDesigners,
        allKeys
      } 
    };
  } catch (err) {
    console.error("Error loading designers index", err);
    return { 
      props: { 
        featuredDesigners: [], 
        groupedDesigners: {},
        allKeys: []
      } 
    };
  }
};
