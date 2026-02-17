// FILE: /components/CurrencyToggle.tsx
// Client-side currency display toggle with approximate conversion rates.
// All prices are stored in USD — this is a display-only conversion.
"use client";
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const RATES: Record<string, number> = {
  USD: 1,
  AUD: 1.55,
  EUR: 0.92,
  GBP: 0.79,
};

const SYMBOLS: Record<string, string> = {
  USD: "US$",
  AUD: "A$",
  EUR: "\u20AC",
  GBP: "\u00A3",
};

type CurrencyCtx = {
  currency: string;
  setCurrency: (c: string) => void;
  convert: (usdAmount: number) => string;
};

const CurrencyContext = createContext<CurrencyCtx>({
  currency: "USD",
  setCurrency: () => {},
  convert: (n) => `US$${n.toLocaleString()}`,
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState("USD");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("ff-currency") : null;
    if (saved && RATES[saved]) setCurrencyState(saved);
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") localStorage.setItem("ff-currency", c);
  };

  const convert = (usdAmount: number): string => {
    const rate = RATES[currency] || 1;
    const converted = Math.round(usdAmount * rate);
    const sym = SYMBOLS[currency] || currency;
    return `${sym}${converted.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "4px 8px",
        fontSize: 12,
        background: "#fff",
        cursor: "pointer",
        color: "#333",
        fontWeight: 600,
      }}
      title="Display currency"
    >
      {Object.keys(RATES).map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
