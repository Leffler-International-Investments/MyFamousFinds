// FILE: /pages/product/[id].tsx
import React, { useState, Component } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getStripe } from "../../lib/getStripe";
import { adminDb } from "../../utils/firebaseAdmin";
import Image from "next/image";

// --- Manually included react-image-magnify component ---
// This is added so you don't need to run `npm install`
class ReactImageMagnify extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      isZoomed: false,
      isLoaded: false,
      isPositionOutside: true,
      elementDimensions: { width: 0, height: 0 },
      imageDimensions: { width: 0, height: 0 },
      lensPosition: { x: 0, y: 0 },
      position: { x: 0, y: 0 },
    };
    this.onSmallImageLoad = this.onSmallImageLoad.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.setImage = this.setImage.bind(this);
  }
  componentDidMount() { this.setImage(); }
  componentDidUpdate(prevProps: any) { if (this.props.smallImage.src !== prevProps.smallImage.src) { this.setState({ isLoaded: false }); this.setImage(); } }
  onSmallImageLoad(e: any) { this.setState({ isLoaded: true, imageDimensions: { width: e.target.width, height: e.target.height } }); }
  onMouseEnter(e: any) {
    const { elementDimensions, imageDimensions } = this.state as any;
    const el = e.currentTarget.getBoundingClientRect();
    const elDims = { width: el.width, height: el.height };
    const imgDims = { width: e.target.width, height: e.target.height };
    this.setState({ isZoomed: true, elementDimensions: elDims, imageDimensions: imgDims });
  }
  onMouseMove(e: any) {
    const { elementDimensions, imageDimensions } = this.state as any;
    const { largeImage, smallImage } = this.props as any;
    const el = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - el.left;
    const y = e.clientY - el.top;
    const largeWidth = largeImage.width;
    const largeHeight = largeImage.height;
    const smallWidth = imageDimensions.width;
    const smallHeight = imageDimensions.height;
    const ratioX = largeWidth / smallWidth;
    const ratioY = largeHeight / smallHeight;
    const isPositionOutside = x < 0 || y < 0 || x > smallWidth || y > smallHeight;
    this.setState({
      isPositionOutside,
      position: { x: x * -ratioX, y: y * -ratioY },
      lensPosition: { x, y },
    });
  }
  onMouseLeave() { this.setState({ isZoomed: false }); }
  setImage() { const img = new (window as any).Image(); img.onload = this.onSmallImageLoad; img.src = this.props.smallImage.src; }
  render() {
    const { smallImage, largeImage, isHintEnabled, enlargedImageContainerStyle } = this.props as any;
    const { isLoaded, isZoomed, isPositionOutside, position, lensPosition, imageDimensions } = this.state as any;
    const { width: largeWidth, height: largeHeight } = largeImage;
    const { width: smallWidth, height: smallHeight } = imageDimensions;
    const isFluid = smallImage.isFluidWidth;
    
    const styles: any = {
      container: { position: 'relative', overflow: 'hidden' },
      smallImage: {
        display: 'block',
        width: isFluid ? '100%' : smallWidth,
        height: 'auto',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in',
      },
      largeImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: largeWidth,
        height: largeHeight,
        transform: `translate(${position.x}px, ${position.y}px)`,
        pointerEvents: 'none',
      },
      zoomContainer: {
        position: 'absolute',
        top: 0,
        left: '100%',
        marginLeft: '10px',
        width: largeWidth,
        height: largeHeight,
        overflow: 'hidden',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        opacity: isLoaded && isZoomed && !isPositionOutside ? 1 : 0,
        transition: 'opacity 0.3s ease-in',
        pointerEvents: 'none',
        ...enlargedImageContainerStyle,
      },
      hint: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0,0,0,0.4)',
        color: '#fff',
        padding: '3px 6px',
        fontSize: '12px',
        borderRadius: '3px',
      }
    };

    return (
      React.createElement('div', { style: styles.container, onMouseEnter: this.onMouseEnter, onMouseMove: this.onMouseMove, onMouseLeave: this.onMouseLeave },
        React.createElement('img', { src: smallImage.src, alt: smallImage.alt, style: styles.smallImage }),
        isHintEnabled && !isZoomed && React.createElement('span', { style: styles.hint }, 'Hover to zoom'),
        React.createElement('div', { style: styles.zoomContainer },
          React.createElement('img', { src: largeImage.src, alt: '', style: styles.largeImage })
        )
      )
    );
  }
}
// -----------------------------------------------------------

type ProductPageProps = {
  id: string;
  title: string;
  price: number;
  currency: string;
  priceLabel: string;
  imageUrls: string[]; // <-- UPDATED
  description: string;
  sellerName: string;
  delivery: string;
  payment: string;
  status: string; // <-- ADDED
};

export default function ProductPage({
  id,
  title,
  price,
  currency,
  priceLabel,
  imageUrls, // <-- UPDATED
  description,
  sellerName,
  delivery,
  payment,
  status, // <-- ADDED
}: ProductPageProps) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  
  // --- ADDED: State for image gallery ---
  const [activeImage, setActiveImage] = useState(
    imageUrls.length > 0 ? imageUrls[0] : "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80"
  );

  async function handleBuyNow() {
    if (!price) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout?id=${encodeURIComponent(id)}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json?.sessionId) {
        throw new Error(json?.error || "Checkout failed");
      }
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Stripe not loaded");
      }
      await stripe.redirectToCheckout({ sessionId: json.sessionId });
    } catch (err) {
      console.error(err);
      alert("Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  function handleRating(value: number) {
    setRating(value);
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 2000);
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>{title} – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <div className="layout">
          {/* --- UPDATED: Image Gallery & Zoom --- */}
          <div className="imageBox">
            {/* Main Magnified Image */}
            <div style={{ zIndex: 10, position: "relative", border: "1px solid #333", borderRadius: "8px", overflow: "hidden" }}>
              <ReactImageMagnify {...{
                  smallImage: {
                    alt: title,
                    isFluidWidth: true,
                    src: activeImage
                  },
                  largeImage: {
                    src: activeImage,
                    width: 1200,
                    height: 1200
                  },
                  enlargedImageContainerStyle: {
                    zIndex: 9999,
                    backgroundColor: "black",
                    border: "1px solid #555"
                  },
                  isHintEnabled: true,
                }} />
            </div>
            
            {/* Thumbnail Gallery */}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
              {imageUrls.map((url, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(url)}
                  style={{
                    width: "80px",
                    height: "80px",
                    cursor: "pointer",
                    borderRadius: "4px",
                    overflow: "hidden",
                    border: activeImage === url ? "2px solid #facc15" : "2px solid #333",
                    position: "relative"
                  }}
                >
                  <Image
                    src={url}
                    alt="thumbnail"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              ))}
            </div>
          </div>
          {/* ------------------------------------- */}

          <div className="infoBox">
            <p className="eyebrow">FAMOUS FINDS / CURATED MARKETPLACE</p>
            <h1>{title}</h1>
            {sellerName && (
              <p className="sub">
                Listed by <strong>{sellerName}</strong>
              </p>
            )}

            {priceLabel && (
              <div className="priceRow">
                <span className="price">{priceLabel}</span>
                {/* --- FIX: Changed currency display --- */}
                <span className="priceSub">All prices in {currency}</span>
              </div>
            )}

            {description && (
              <p className="desc">
                {description}
              </p>
            )}

            <div className="meta">
              <div>
                <p className="metaLabel">Delivery</p>
                <p className="metaValue">
                  {delivery || "Tracked, insured shipping arranged with seller."}
                </p>
              </div>
              <div>
                <p className="metaLabel">Payment</p>
                <p className="metaValue">
                  {payment ||
                    "Secure payments handled by Stripe. Major cards and wallets accepted."}
                </p>
              </div>
            </div>

            {/* --- UPDATED: Buy Button Logic --- */}
            {status === "Live" ? ( // <-- Check for "Live" status
              <button
                className="buy"
                onClick={handleBuyNow}
                disabled={loading || !price}
              >
                {loading ? "Processing..." : "Buy now"}
              </button>
            ) : (
              <button
                className="buy"
                disabled
                style={{ background: "#555", color: "#999", cursor: "not-allowed" }}
              >
                {status || "Not Available"}
              </button>
            )}


            <p className="authDisclaimer">
              <strong>Disclaimer:</strong> Famous Finds operates as a peer-to-peer
              marketplace. Each listing is uploaded by an independent seller. While we
              apply authenticity review measures, Famous Finds does not guarantee the
              authenticity of any individual item. In case of a dispute, legal
              responsibility rests solely with the seller.
            </p>

            <div className="rating">
              <p className="ratingLabel">
                Rate this item{" "}
                <span className="text-gray-500">(private signal to our team)</span>
              </p>
              <div>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="star"
                    type="button"
                    onClick={() => handleRating(star)}
                  >
                    {rating && star <= rating ? "★" : "☆"}
                  </button>
                ))}
              </div>
              {showThanks && (
                <p className="ratingThanks">Thanks, your signal has been noted.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* --- UPDATED: Styles to remove border --- */}
      <style jsx>{`
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
          gap: 36px;
        }
        .imageBox {
          /* Removed the old border/background styles */
        }
        .imageBox img {
          /* This is no longer used for the main image */
        }
        .infoBox {
          padding: 8px 4px;
        }
        .eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
        }
        h1 {
          margin-top: 4px;
          font-size: 26px;
          letter-spacing: 0.02em;
        }
        .sub {
          font-size: 13px;
          color: #d1d5db;
        }
        .priceRow {
          margin-top: 16px;
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .price {
          font-size: 24px;
          font-weight: 600;
        }
        .priceSub {
          font-size: 12px;
          color: #9ca3af;
        }
        .desc {
          margin-top: 16px;
          font-size: 14px;
          color: #e5e7eb;
          line-height: 1.6;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }
        .metaLabel {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
        }
        .metaValue {
          font-size: 13px;
          color: #e5e7eb;
        }
        .buy {
          margin-top: 18px;
          border-radius: 999px;
          padding: 10px 24px;
          border: none;
          background: #ffffff;
          color: #000;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .buy:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .rating {
          margin-top: 18px;
          font-size: 13px;
        }
        .authDisclaimer {
          margin-top: 10px;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.4;
        }
        .ratingLabel {
          color: #d1d5db;
        }
        .ratingThanks {
          color: #a3e635;
          font-size: 12px;
        }
        .star {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 20px;
          color: #4b5563;
        }
        .star:hover {
          color: #e5e7eb;
        }
        @media (max-width: 900px) {
          .layout {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const id = ctx.params?.id as string;
    if (!id) return { notFound: true };

    const snap = await adminDb.collection("listings").doc(id).get();
    if (!snap.exists) {
      return { notFound: true };
    }

    const d: any = snap.data() || {};
    const priceNumber = Number(d.price) || 0;
    
    // --- FIX: Currency set to USD ---
    const currency = d.currency || "USD"; 
    const priceLabel = priceNumber
      ? new Intl.NumberFormat("en-US", { // <-- Changed to en-US
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(priceNumber)
      : "";

    const sellerName =
      d.sellerName || d.sellerDisplayName || "Independent seller";
      
    // --- UPDATED: Handle new 'imageUrls' array ---
    let imageUrls: string[] = [];
    if (Array.isArray(d.imageUrls) && d.imageUrls.length > 0) {
      imageUrls = d.imageUrls;
    } else if (d.imageUrl) {
      imageUrls = [d.imageUrl];
    } else if (d.image) {
      imageUrls = [d.image]; // Fallback for 'image' field
    } else {
      imageUrls = ["https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80"];
    }
    // ---------------------------------------------

    return {
      props: {
        id,
        title: d.title || "Untitled listing",
        price: priceNumber,
        currency,
        priceLabel,
        imageUrls: imageUrls, // <-- Pass the array
        description: d.description || "",
        sellerName,
        delivery: d.delivery || "",
        payment: d.payment || "",
        status: d.status || "PendingReview", // <-- Pass the status
      },
    };
  } catch (err) {
    console.error("Error loading product", err);
    return { notFound: true };
  }
};
