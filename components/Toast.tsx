// FILE: /components/Toast.tsx
import React, { createContext, useCallback, useContext, useState } from "react";

type ToastContextType = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 2500);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {message && (
        <div className={`toast-bar ${visible ? "toast-visible" : "toast-hidden"}`}>
          {message}
        </div>
      )}
      {children}

      <style jsx>{`
        .toast-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          text-align: center;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #065f46;
          background: #d1fae5;
          border-bottom: 1px solid #a7f3d0;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .toast-visible {
          transform: translateY(0);
          opacity: 1;
        }
        .toast-hidden {
          transform: translateY(-100%);
          opacity: 0;
        }
      `}</style>
    </ToastContext.Provider>
  );
}
