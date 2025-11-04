// /pages/cart.tsx
import Link from "next/link";
import { useState } from "react";

export default function Cart() {
  const [items, setItems] = useState([
    { id: 1, name: "Gucci Marmont Mini Bag", price: 2450 },
    { id: 2, name: "Chanel Slingbacks", price: 1250 },
  ]);
  const [saved, setSaved] = useState([]);

  const moveToSaved = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setSaved([...saved, item]);
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <Link href="/" className="text-blue-600">← Return to Dashboard</Link>
      </div>

      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border p-4 rounded-lg flex justify-between">
              <span>{item.name}</span>
              <div className="flex gap-2">
                <span>${item.price}</span>
                <button
                  onClick={() => moveToSaved(item.id)}
                  className="text-sm text-blue-600"
                >
                  Save for later
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {saved.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-2">Saved for Later</h2>
          {saved.map((s) => (
            <div key={s.id} className="border p-4 rounded-lg flex justify-between">
              <span>{s.name}</span>
              <span>${s.price}</span>
            </div>
          ))}
          <p className="text-xs text-red-600 mt-2">
            ⚠️ Items may sell out — saved items are not reserved.
          </p>
        </div>
      )}
    </div>
  );
}
