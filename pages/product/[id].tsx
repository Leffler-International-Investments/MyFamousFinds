// FILE: /pages/product/[id].tsx
import React, { useState } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getStripe } from "../../lib/getStripe";
import { adminDb } from "../../utils/firebaseAdmin";

type ProductPageProps = {
  id: string;
  title: string;
  price: number;
  currency: string;
  priceLabel: string;
  imageUrl: string;
  condition: string;
  brand: string;
  category: string;
  color: string;
  size: string;
  description: string;
  sellerName: string;
};

export default function ProductPage(props: ProductPageProps) {
  const {
    id,
    title,
    price,
    currency,
    priceLabel,
    imageUrl,
    condition,
    brand,
    category,
    color,
    size,
    description,
    sellerName,
  } = props;

  const [loading, setLoading] = useState(false);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  const handleBuyNow = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title,
          price,
          image: imageUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.sessionId) {
        throw new Error(json?.error || "Unable to create checkout session");
      }

      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Stripe not loaded");
      }

      await stripe.redirectToCheckout({ sessionId: json.sessionId });
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Checkout failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOfferError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const offerValue = Number(formData.get("offer_value") || 0);
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!offerValue || offerValue <= 0) {
      setOfferError("Please enter a valid offer.");
      return;
    }

    if (!email) {
      setOfferError("Please enter your email so we can respond.");
      return;
    }

    try {
      setOfferSubmitting(true);
      const res = await fetch("/api/offers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          offerValue,
          buyerEmail: email,
          message,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to submit offer");
      }

      form.reset();
      alert("Your offer has been submitted to the seller.");
    } catch (err: any) {
      console.error(err);
      setOfferError(err?.message || "Unable to submit offer");
    } finally {
      setOfferSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Head>
        <title>{title} — Famous-Finds</title>
      </Head>
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <nav className="mb-4 text-xs text-gray-400">
          <span>Home</span> <span className="mx-1">/</span>
          <span>Women</span> <span className="mx-1">/</span>
          <span className="text-gray-200">{title}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Product image */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-400">
              Authenticity and quality vetted before shipment. Free returns if
              not as described.
            </p>
          </div>

          {/* Product details */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Famous-Finds
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">
                {title}
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Sold by {sellerName}. Inspected and shipped via Famous-Finds
                concierge.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-2xl font-semibold text-white">{priceLabel}</p>
              <p className="text-xs text-gray-400">
                All prices in USD. Taxes and shipping calculated at checkout.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-xs text-gray-300">
              <div>
                <dt className="text-gray-500">Condition</dt>
                <dd className="font-medium text-gray-100">{condition}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Brand</dt>
                <dd className="font-medium text-gray-100">{brand}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-100">{category}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Color</dt>
                <dd className="font-medium text-gray-100">{color}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Size</dt>
                <dd className="font-medium text-gray-100">{size}</dd>
              </div>
            </dl>

            <div>
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Description
              </h2>
              <p className="text-sm leading-relaxed text-gray-200">
                {description || "No additional description provided."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleBuyNow}
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Processing…" : "Buy now"}
              </button>
              <button
                onClick={() => {
                  const form = document.getElementById("offer-form");
                  if (form) {
                    form.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/5"
              >
                Make an offer
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-gray-200">
              <p className="font-semibold text-white">
                How Famous-Finds protects you
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Funds held securely until your item is authenticated.</li>
                <li>
                  If the item is not as described, you are fully refunded.
                </li>
                <li>All payments processed in USD via Stripe.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Offer form */}
        <section id="offer-form" className="mt-12 max-w-lg space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Make an offer
          </h2>
          <p className="text-xs text-gray-300">
            If you have a reasonable offer, submit it here and our team will
            contact the seller on your behalf.
          </p>

          <form
            onSubmit={handleOfferSubmit}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs"
          >
            <div>
              <label
                htmlFor="offer_value"
                className="block text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400"
              >
                Offer amount (USD)
              </label>
              <input
                id="offer_value"
                name="offer_value"
                type="number"
                step="1"
                min="1"
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                placeholder="Enter your offer in USD"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400"
              >
                Your email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400"
              >
                Optional message
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                placeholder="Tell the seller anything you’d like them to know."
              />
            </div>

            {offerError && (
              <p className="text-xs text-red-400">{offerError}</p>
            )}

            <button
              type="submit"
              disabled={offerSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-2.5 text-xs font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {offerSubmitting ? "Submitting…" : "Submit offer"}
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<ProductPageProps> = async (
  context
) => {
  const id = String(context.params?.id || "");

  if (!id) {
    return { notFound: true };
  }

  try {
    const doc = await adminDb.collection("listings").doc(id).get();
    if (!doc.exists) {
      return { notFound: true };
    }

    const d = doc.data() || {};
    const priceNumber = Number(d.price) || 0;
    const currency = d.currency || "USD";
    const priceLabel = priceNumber
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(priceNumber)
      : "";

    const sellerName =
      d.sellerName || d.sellerDisplayName || "Independent seller";

    return {
      props: {
        id,
        title: d.title || "Product",
        price: priceNumber,
        currency,
        priceLabel,
        imageUrl:
          d.imageUrl ||
          d.imageUrls?.[0] ||
          "/images/placeholders/product-placeholder.jpg",
        condition: d.condition || "Pre-owned",
        brand: d.brand || "Designer",
        category: d.category || "Fashion",
        color: d.color || "Mixed",
        size: d.size || "One size",
        description: d.description || "",
        sellerName,
      },
    };
  } catch (err) {
    console.error("Error loading product:", err);
    return { notFound: true };
  }
};
