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

  componentDidMount() {
    this.setImage();
  }
  componentDidUpdate(prevProps: any) {
    // eslint-disable-next-line
    // @ts-ignore
    if (this.props.smallImage?.src !== prevProps.smallImage?.src) {
      this.setState({ isLoaded: false });
      this.setImage();
    }
  }

  onSmallImageLoad(e: any) {
    this.setState({
      isLoaded: true,
      imageDimensions: { width: e.target.width, height: e.target.height },
    });
  }

  onMouseEnter(e: any) {
    const { elementDimensions, imageDimensions } = this.state as any;
    const el = e.currentTarget.getBoundingClientRect();
    const elDims = { width: el.width, height: el.height };
    const imgDims = { width: e.target.width, height: e.target.height };
    this.setState({
      isZoomed: true,
      elementDimensions: elDims,
      imageDimensions: imgDims,
    });
  }

  onMouseMove(e: any) {
    const { elementDimensions, imageDimensions } = this.state as any;
    const { largeImage, smallImage } = this.props as any;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Lens position in small image space
    const lensX = Math.max(
      0,
      Math.min(x, elementDimensions.width || imageDimensions.width)
    );
    const lensY = Math.max(
      0,
      Math.min(y, elementDimensions.height || imageDimensions.height)
    );

    // Map lens position to large image translation
    const ratioX = (largeImage.width - (smallImage.width || 0)) /
      (elementDimensions.width || imageDimensions.width || 1);
    const ratioY = (largeImage.height - (smallImage.height || 0)) /
      (elementDimensions.height || imageDimensions.height || 1);

    const posX = -lensX * ratioX;
    const posY = -lensY * ratioY;

    const isOutside =
      x < 0 ||
      y < 0 ||
      x > (elementDimensions.width || imageDimensions.width) ||
      y > (elementDimensions.height || imageDimensions.height);

    this.setState({
      lensPosition: { x: lensX, y: lensY },
      position: { x: posX, y: posY },
      isPositionOutside: isOutside,
    });
  }

  onMouseLeave() {
    this.setState({
      isZoomed: false,
      lensPosition: { x: 0, y: 0 },
      position: { x: 0, y: 0 },
      isPositionOutside: true,
    });
  }

  setImage() {
    // We could add additional logic if needed
  }

  render() {
    const {
      smallImage,
      largeImage,
      isHintEnabled,
      enlargedImageContainerStyle,
    } = this.props as any;
    const {
      isLoaded,
      isZoomed,
      isPositionOutside,
      position,
      imageDimensions,
    } = this.state as any;
    const { width: largeWidth, height: largeHeight } = largeImage;
    const { width: smallWidth, height: smallHeight } = imageDimensions;
    const isFluid = smallImage.isFluidWidth;

    const styles: any = {
      container: { position: "relative", overflow: "hidden" },
      smallImage: {
        display: "block",
        width: isFluid ? "100%" : smallWidth,
        height: "auto",
        opacity: isLoaded ? 1 : 0,
        transition: "opacity 0.3s ease-in",
      },
      largeImage: {
        position: "absolute",
        top: 0,
        left: 0,
        width: largeWidth,
        height: largeHeight,
        transform: `translate(${position.x}px, ${position.y}px)`,
        pointerEvents: "none",
      },
      zoomContainer: {
        position: "absolute",
        top: 0,
        left: "100%",
        marginLeft: "10px",
        width: largeWidth,
        height: largeHeight,
        overflow: "hidden",
        border: "1px solid #ccc",
        backgroundColor: "#fff",
        opacity: isLoaded && isZoomed && !isPositionOutside ? 1 : 0,
        transition: "opacity 0.3s ease-in",
        pointerEvents: "none",
        ...enlargedImageContainerStyle,
      },
      hint: {
        position: "absolute",
        top: "10px",
        right: "10px",
        backgroundColor: "rgba(0,0,0,0.4)",
        color: "#fff",
        padding: "3px 6px",
        fontSize: "12px",
        borderRadius: "3px",
      },
    };

    return (
      // eslint-disable-next-line
      // @ts-ignore
      React.createElement(
        "div",
        {
          style: styles.container,
          onMouseEnter: this.onMouseEnter,
          onMouseMove: this.onMouseMove,
          onMouseLeave: this.onMouseLeave,
        },
        React.createElement("img", {
          src: smallImage.src,
          alt: smallImage.alt,
          style: styles.smallImage,
          onLoad: this.onSmallImageLoad,
        }),
        isHintEnabled &&
          !isZoomed &&
          React.createElement("span", { style: styles.hint }, "Hover to zoom"),
        React.createElement(
          "div",
          { style: styles.zoomContainer },
          React.createElement("img", {
            src: largeImage.src,
            alt: "",
            style: styles.largeImage,
          })
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
  imageUrls: string[];
  description: string;
  sellerName: string;
  delivery: string;
  payment: string;
  status: string | null;
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
    imageUrls.length > 0
      ? imageUrls[0]
      : "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto-format&fit=crop&w=900&q=80"
  );

  async function handleBuyNow() {
    if (!price) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout?id=${encodeURIComponent(id)}`, {
        method: "POST",
      });
      const json = await res.json();
      const stripe = await getStripe();
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: json.id });
      }
    } catch (err) {
      console.error("Checkout error", err);
      alert("There was an issue preparing checkout.");
    } finally {
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
            <div
              style={{
                zIndex: 10,
                position: "relative",
                border: "1px solid #333",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <ReactImageMagnify
                {...{
                  smallImage: {
                    alt: title,
                    isFluidWidth: true,
                    src: activeImage,
                  },
                  largeImage: {
                    src: activeImage,
                    width: 1200,
                    height: 1200,
                  },
                  // turn off “Hover to zoom” hint overlay
                  isHintEnabled: false,
                  enlargedImageContainerStyle: {
                    zIndex: 9999,
                    backgroundColor: "black",
                    border: "1px solid #555",
                  },
                }}
              />
            </div>

            {/* Thumbnail Gallery */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "10px",
                flexWrap: "wrap",
              }}
            >
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
                    border:
                      activeImage === url
                        ? "2px solid #facc15"
                        : "2px solid #333",
                    position: "relative",
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

          <div>
            <p className="eyebrow">FAMOUS FINDS / CURATED MARKETPLACE</p>
            <h1>{title}</h1>
            <p className="sub">
              Listed by{" "}
              <span className="sellerName">
                {sellerName || "Independent seller"}
              </span>
            </p>

            {price > 0 && (
              <div className="priceBlock">
                <div className="priceMain">
                  <span className="price">{priceLabel}</span>
                </div>
                <span className="priceSub">All prices in {currency}</span>
              </div>
            )}

            {description && <p className="desc">{description}</p>}

            <div className="meta">
              <div>
                <p className="metaLabel">Delivery</p>
                <p className="metaValue">
                  {delivery ||
                    "Tracked, insured shipping arranged with seller."}
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

            <button
              className="buy"
              disabled={loading || !price}
              onClick={handleBuyNow}
            >
              {loading ? "Preparing checkout…" : "Buy now"}
            </button>

            <p className="disclaimer">
              <strong>Disclaimer:</strong> Famous Finds operates as a peer-to-peer
              marketplace. Each listing is uploaded by an independent seller.
              While we apply authenticity review measures, Famous Finds does not
              guarantee the authenticity of any individual item. In case of a
              dispute, legal responsibility rests solely with the seller.
            </p>

            {/* Rating block – bigger stars, numbers, yellow when active */}
            <div className="rating">
              <p className="ratingLabel">
                Rate this item{" "}
                <span className="text-gray-500">
                  (private signal to our team)
                </span>
              </p>
              <div className="ratingRow">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = rating !== null && star <= rating;
                  return (
                    <button
                      key={star}
                      className="star"
                      type="button"
                      onClick={() => handleRating(star)}
                      style={{
                        color: isActive ? "#facc15" : "#4b5563",
                      }}
                    >
                      <span>{isActive ? "★" : "☆"}</span>
                      <span className="starNumber">{star}</span>
                    </button>
                  );
                })}
              </div>
              {rating !== null && (
                <p className="ratingHint">You rated this item {rating} / 5</p>
              )}
              {showThanks && (
                <p className="ratingThanks">
                  Thanks, your signal has been noted.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

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
        }
        .heroCopy {
          margin-bottom: 18px;
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
          font-size: 14px;
          margin-top: 6px;
          color: #9ca3af;
        }
        .sellerName {
          color: #facc15;
        }
        .priceBlock {
          margin-top: 16px;
          margin-bottom: 12px;
        }
        .priceMain {
          font-size: 26px;
          font-weight: 600;
        }
        .priceSub {
          font-size: 12px;
          color: #9ca3af;
        }
        .desc {
          margin-top: 10px;
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
        .disclaimer {
          margin-top: 18px;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.6;
        }
        .rating {
          margin-top: 20px;
        }
        .ratingLabel {
          font-size: 13px;
          color: #e5e7eb;
          margin-bottom: 4px;
        }
        .ratingRow {
          display: flex;
          gap: 8px;
          margin-top: 6px;
        }
        .star {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 24px;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 0 4px;
        }
        .starNumber {
          font-size: 11px;
          margin-top: -2px;
          color: #9ca3af;
        }
        .ratingHint {
          margin-top: 4px;
          font-size: 11px;
          color: #9ca3af;
        }
        .star:hover span:first-child {
          transform: scale(1.05);
        }
        .ratingThanks {
          margin-top: 4px;
          font-size: 12px;
          color: #a3e635;
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
    const currency = "USD";
    const priceLabel = priceNumber
      ? `$${priceNumber.toLocaleString("en-US")}`
      : "";

    // Normalize imageUrls
    const images: string[] = Array.isArray(d.imageUrls)
      ? d.imageUrls
      : d.imageUrl
      ? [d.imageUrl]
      : d.image
      ? [d.image]
      : [
          "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto-format&fit=crop&w=900&q=80",
        ];

    return {
      props: {
        id: snap.id,
        title: d.title || "Untitled listing",
        price: priceNumber,
        currency,
        priceLabel,
        imageUrls: images,
        description: d.description || "",
        sellerName: d.sellerName || d.seller || "",
        delivery: d.delivery || "",
        payment: d.payment || "",
        status: d.status || null,
      },
    };
  } catch (err) {
    console.error("Error loading product", err);
    return { notFound: true };
  }
};
