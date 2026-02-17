// FILE: /components/Analytics.tsx
// Google Analytics 4 integration with e-commerce event helpers.
import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID || "";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function gtag(...args: any[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

// E-commerce event helpers
export function trackViewItem(item: {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  price?: number;
  currency?: string;
}) {
  gtag("event", "view_item", {
    currency: item.currency || "USD",
    value: item.price || 0,
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_brand: item.brand || "",
      item_category: item.category || "",
      price: item.price || 0,
    }],
  });
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  currency?: string;
}) {
  gtag("event", "add_to_cart", {
    currency: item.currency || "USD",
    value: item.price || 0,
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_brand: item.brand || "",
      price: item.price || 0,
    }],
  });
}

export function trackPurchase(order: {
  orderId: string;
  value: number;
  currency?: string;
  items: { id: string; name: string; price: number }[];
}) {
  gtag("event", "purchase", {
    transaction_id: order.orderId,
    value: order.value,
    currency: order.currency || "USD",
    items: order.items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
    })),
  });
}

export default function Analytics() {
  const router = useRouter();

  // Track page views on route change
  useEffect(() => {
    if (!GA_ID) return;
    const handleRouteChange = (url: string) => {
      gtag("config", GA_ID, { page_path: url });
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router]);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
