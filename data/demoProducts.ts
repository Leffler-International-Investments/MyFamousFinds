// FILE: /data/demoProducts.ts
export type DemoProduct = {
  id: string;
  title: string;
  brand: string;
  price: string;        // show with currency symbol already
  image: string;        // public URL or /public path
  category: "Bags" | "Clothing" | "Shoes" | "Accessories" | "Jewelry" | "Watches";
  condition?: "New" | "Excellent" | "Very Good" | "Good";
  location?: string;    // e.g., "Sydney, Australia"
  badge?: string;       // e.g., "Trending", "Best Seller"
};

const img = (q: string) =>
  `https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=${q}`;

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: "p1",  title: "Neverfull MM Tote",    brand: "Louis Vuitton", price: "AU$1,950", image: img("72"), category: "Bags",       condition: "Very Good", location: "Melbourne",   badge: "Trending" },
  { id: "p2",  title: "Classic Flap Small",   brand: "Chanel",        price: "AU$6,990", image: img("71"), category: "Bags",       condition: "Excellent", location: "Sydney",     badge: "Best Seller" },
  { id: "p3",  title: "Drew Shoulder",        brand: "Chloé",         price: "AU$1,450", image: img("70"), category: "Bags",       condition: "Very Good", location: "Perth" },
  { id: "p4",  title: "Saddle Bag",           brand: "Dior",          price: "AU$3,900", image: img("69"), category: "Bags",       condition: "Excellent", location: "Adelaide" },
  { id: "p5",  title: "Silk Blouse",          brand: "Roberto Cavalli",price:"AU$480",   image: img("68"), category: "Clothing",   condition: "Excellent", location: "Brisbane" },
  { id: "p6",  title: "Boyfriend Jeans",      brand: "Diesel",        price: "AU$220",   image: img("67"), category: "Clothing",   condition: "Very Good" },
  { id: "p7",  title: "Leather Loafers",      brand: "Gucci",         price: "AU$690",   image: img("66"), category: "Shoes",      condition: "Very Good" },
  { id: "p8",  title: "Catwalk Heels",        brand: "Jimmy Choo",    price: "AU$540",   image: img("65"), category: "Shoes",      condition: "Good" },
  { id: "p9",  title: "Ava Earrings",         brand: "Céline",        price: "AU$380",   image: img("64"), category: "Jewelry" },
  { id: "p10", title: "Leather Belt",         brand: "Hermès",        price: "AU$820",   image: img("63"), category: "Accessories" },
  { id: "p11", title: "Brooch",               brand: "Chanel",        price: "AU$620",   image: img("62"), category: "Accessories" },
  { id: "p12", title: "Speedy 25",            brand: "Louis Vuitton", price: "AU$1,790", image: img("61"), category: "Bags",       badge: "New" },
  { id: "p13", title: "Linen Dress",          brand: "Zimmermann",    price: "AU$560",   image: img("60"), category: "Clothing" },
  { id: "p14", title: "Iconic Sneakers",      brand: "Dior",          price: "AU$980",   image: img("59"), category: "Shoes" },
  { id: "p15", title: "Chain Necklace",       brand: "Saint Laurent", price: "AU$450",   image: img("58"), category: "Jewelry" },
  { id: "p16", title: "Leather Watch",        brand: "Cartier",       price: "AU$4,900", image: img("57"), category: "Watches",    badge: "Trending" },
  { id: "p17", title: "Mini Tote",            brand: "Prada",         price: "AU$1,650", image: img("56"), category: "Bags" },
  { id: "p18", title: "Maxi Dress",           brand: "D&G",           price: "AU$760",   image: img("55"), category: "Clothing" },
  { id: "p19", title: "Chelsea Boots",        brand: "Burberry",      price: "AU$820",   image: img("54"), category: "Shoes" },
  { id: "p20", title: "Stud Earrings",        brand: "Tiffany & Co.", price: "AU$390",   image: img("53"), category: "Jewelry" },
  { id: "p21", title: "Cap",                  brand: "Balenciaga",    price: "AU$260",   image: img("52"), category: "Accessories" },
  { id: "p22", title: "Crossbody",            brand: "Givenchy",      price: "AU$1,290", image: img("51"), category: "Bags" },
  { id: "p23", title: "Knit Cardigan",        brand: "Miu Miu",       price: "AU$540",   image: img("50"), category: "Clothing" },
  { id: "p24", title: "Aviator Sunglasses",   brand: "Ray-Ban",       price: "AU$210",   image: img("49"), category: "Accessories" }
];

// Convenience slices
export const DEMO_BY_CATEGORY = {
  Bags: DEMO_PRODUCTS.filter(p => p.category === "Bags"),
  Clothing: DEMO_PRODUCTS.filter(p => p.category === "Clothing"),
  Shoes: DEMO_PRODUCTS.filter(p => p.category === "Shoes"),
  Accessories: DEMO_PRODUCTS.filter(p => p.category === "Accessories"),
  Jewelry: DEMO_PRODUCTS.filter(p => p.category === "Jewelry"),
  Watches: DEMO_PRODUCTS.filter(p => p.category === "Watches"),
};

export const NOW_TRENDING = DEMO_PRODUCTS.slice(0, 8);
export const BEST_SELLERS = DEMO_PRODUCTS.filter(p => p.badge === "Best Seller").concat(DEMO_PRODUCTS.slice(3, 7)).slice(0, 8);
export const NEW_ARRIVALS = DEMO_PRODUCTS.slice(8, 16);
