// FILE: components/PostPurchaseButler.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

type PostPurchaseButlerProps = {
  brand: string;
  itemTitle: string;
  category: string;
  vipUrl: string;
};

export default function PostPurchaseButler({
  brand,
  itemTitle,
  category,
  vipUrl,
}: PostPurchaseButlerProps) {
  const router = useRouter();

  function speak(text: string) {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    const msg =
      `Congratulations on your purchase. You have just secured a beautiful ${brand} ${itemTitle}. ` +
      `If you like, I can show you matching pieces to go with it, ` +
      `and I recommend joining our Famous Finds Front Row VIP Club ` +
      `to earn points and receive exclusive member benefits.`;
    speak(msg);
  }, [brand, itemTitle]);

  const congratsText = `Congratulations on your purchase! You’ve just secured a beautiful ${brand} ${itemTitle}.`;
  const crossSellText =
    "Would you like to see other pieces that go perfectly with it?";
  const vipText =
    "It’s very advisable to join our Famous Finds Front Row VIP Club. You’ll earn points on purchases, get early access to new arrivals, and enjoy exclusive member benefits.";

  function handleShowMatching() {
    const query = `${brand} ${category}`;
    router.push(`/catalogue?search=${encodeURIComponent(query)}`);
  }

  function handleOpenVip() {
    router.push(vipUrl);
  }

  return (
    <>
      <div className="ppButler">
        <div className="ppHeader">
          <span className="ppTitle">🤵 AI Butler</span>
        </div>

        <div className="ppBody">
          <p>{congratsText}</p>
          <p>{crossSellText}</p>
          <p>{vipText}</p>
        </div>

        <div className="ppActions">
          <button onClick={handleShowMatching} className="ppBtnPrimary">
            Show matching pieces
          </button>
          <button onClick={handleOpenVip} className="ppBtnSecondary">
            Join the VIP Club
          </button>
        </div>
      </div>

      <style jsx>{`
        .ppButler {
          position: fixed;
          right: 16px;
          bottom: 16px;
          max-width: 360px;
          width: 90vw;
          background: #111827;
          color: #f9fafb;
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          font-size: 13px;
          z-index: 11000;
        }
        .ppHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .ppTitle {
          font-weight: 600;
        }
        .ppBody p {
          margin: 4px 0;
        }
        .ppActions {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .ppBtnPrimary,
        .ppBtnSecondary {
          flex: 1;
          min-width: 120px;
          border-radius: 999px;
          border: none;
          padding: 6px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        .ppBtnPrimary {
          background: #f9fafb;
          color: #111827;
        }
        .ppBtnSecondary {
          background: transparent;
          color: #f9fafb;
          border: 1px solid #f9fafb;
        }
        @media (max-width: 480px) {
          .ppButler {
            left: 8px;
            right: 8px;
          }
        }
      `}</style>
    </>
  );
}
