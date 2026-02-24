// FILE: /components/PhoneVerificationPopup.tsx
// AWS-compliant phone verification popup for SMS OTP flow.
// Shows consent disclosures required by AWS SNS/Pinpoint registration.
// Used during seller and management login when SMS 2FA is selected.

import { useState } from "react";

type Props = {
  /** Pre-filled phone number from Firestore (if available) */
  phone?: string;
  /** Called when user clicks Send Code */
  onSendCode: (phone: string, countryCode: string) => void;
  /** Called when user clicks Back */
  onBack: () => void;
  /** Whether the send action is in progress */
  loading?: boolean;
};

export default function PhoneVerificationPopup({
  phone: initialPhone,
  onSendCode,
  onBack,
  loading,
}: Props) {
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState(initialPhone || "");

  return (
    <div className="pv-overlay">
      <div className="pv-card">
        <div className="pv-brand">MyFamousFinds</div>
        <h2 className="pv-title">Verify your phone number</h2>
        <p className="pv-desc">
          Enter your mobile number to receive a one-time verification code.
        </p>

        <div className="pv-badge">Use case: ONE_TIME_PASSCODES (OTP)</div>

        <label className="pv-label" htmlFor="pv-phone">
          Mobile number
        </label>
        <div className="pv-row">
          <select
            className="pv-select"
            aria-label="Country code"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            <option value="+1">+1</option>
            <option value="+61">+61</option>
            <option value="+44">+44</option>
            <option value="+972">+972</option>
          </select>
          <input
            id="pv-phone"
            className="pv-input"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button
          className="pv-btn"
          type="button"
          disabled={loading || !phone.trim()}
          onClick={() => onSendCode(phone.trim(), countryCode)}
        >
          {loading ? "Sending…" : "Send Code"}
        </button>

        <div className="pv-fineprint">
          <strong>Consent &amp; disclosures:</strong>
          <br />
          By entering your phone number and clicking &quot;Send Code,&quot; you
          agree to receive a one-time SMS verification message from MyFamousFinds
          for account authentication purposes only. Messages are sent only in
          response to a user-initiated request. Message &amp; data rates may
          apply. Message frequency varies. Reply <strong>STOP</strong> to opt out
          or <strong>HELP</strong> for help.
        </div>

        <div className="pv-links">
          <a href="/terms" target="_blank" rel="noreferrer">
            Terms &amp; Conditions
          </a>
          <a href="/privacy" target="_blank" rel="noreferrer">
            Privacy Policy
          </a>
        </div>

        <div className="pv-footer-note">
          Screenshot this screen for AWS &quot;Opt-in workflow image&quot;
          submission.
        </div>

        <button className="pv-back" type="button" onClick={onBack}>
          Back
        </button>
      </div>

      <style jsx>{`
        .pv-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
        }
        .pv-card {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
          color: #111827;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Arial, sans-serif;
        }
        .pv-brand {
          font-weight: 800;
          letter-spacing: 0.2px;
          font-size: 18px;
          margin-bottom: 8px;
          color: #111827;
        }
        .pv-title {
          font-size: 22px;
          margin: 6px 0 8px;
          color: #111827;
          font-weight: 700;
        }
        .pv-desc {
          margin: 0 0 14px;
          color: #6b7280;
          line-height: 1.4;
          font-size: 14px;
        }
        .pv-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: #065f46;
          background: #d1fae5;
          border: 1px solid #a7f3d0;
          padding: 6px 10px;
          border-radius: 999px;
          margin-bottom: 10px;
        }
        .pv-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin: 14px 0 6px;
          color: #374151;
        }
        .pv-row {
          display: flex;
          gap: 10px;
        }
        .pv-select,
        .pv-input {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          font-size: 15px;
          outline: none;
          background: #fff;
          color: #111827;
        }
        .pv-select {
          width: 110px;
          flex-shrink: 0;
        }
        .pv-input {
          flex: 1;
          min-width: 0;
        }
        .pv-btn {
          width: 100%;
          margin-top: 14px;
          border: 0;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          background: #111827;
          color: #fff;
          transition: opacity 0.2s;
        }
        .pv-btn:hover {
          opacity: 0.9;
        }
        .pv-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .pv-fineprint {
          margin-top: 14px;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.45;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
        }
        .pv-links {
          margin-top: 12px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          font-size: 13px;
        }
        .pv-links a {
          color: #111827;
          text-decoration: underline;
        }
        .pv-footer-note {
          margin-top: 10px;
          font-size: 12px;
          color: #6b7280;
        }
        .pv-back {
          margin-top: 12px;
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          background: #fff;
          color: #374151;
          transition: border-color 0.2s;
        }
        .pv-back:hover {
          border-color: #111827;
        }
      `}</style>
    </div>
  );
}
