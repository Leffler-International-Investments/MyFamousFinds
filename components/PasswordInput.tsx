// FILE: /components/PasswordInput.tsx
import { useState } from "react";

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  showStrength?: boolean;
  placeholder?: string;
}

type StrengthLevel = "" | "weak" | "ok" | "strong" | "very-strong";

interface StrengthInfo {
  label: string;
  level: StrengthLevel;
  score: number;
}

function computeStrength(password: string): StrengthInfo {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++; // has lowercase
  if (/[A-Z]/.test(password)) score++; // has uppercase
  if (/[0-9]/.test(password)) score++; // has number
  if (/[^A-Za-z0-9]/.test(password)) score++; // has symbol

  // Normalize score to 0-4 scale for bars
  // 0-1: weak, 2: ok, 3: strong, 4-5: very strong
  let normalizedScore = 0;
  if (score > 0) normalizedScore = 1;
  if (score >= 3) normalizedScore = 2;
  if (score >= 4) normalizedScore = 3;
  if (score >= 5) normalizedScore = 4;

  if (!password) {
    return { label: "", level: "", score: 0 };
  }
  if (normalizedScore <= 1) {
    return {
      label: "Weak",
      level: "weak",
      score: 1,
    };
  }
  if (normalizedScore === 2) {
    return {
      label: "Fair",
      level: "ok",
      score: 2,
    };
  }
  if (normalizedScore === 3) {
    return {
      label: "Good",
      level: "strong",
      score: 3,
    };
  }
  return {
    label: "Strong",
    level: "very-strong",
    score: 4,
  };
}

export default function PasswordInput({
  label,
  value,
  onChange,
  name,
  required,
  showStrength,
  placeholder,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength
    ? computeStrength(value)
    : { label: "", level: "" as StrengthLevel, score: 0 };

  return (
    <div className="auth-field">
      <label htmlFor={name}>{label}</label>
      <div className="password-input-row">
        <input
          id={name}
          type={visible ? "text" : "password"}
          name={name}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="auth-input"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="password-toggle"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      
      {/* Visual Strength Meter */}
      {showStrength && value.length > 0 && (
        <div className="mt-2">
          <div className="pw-strength">
            <div className={`bar ${strength.score >= 1 ? "on" : ""}`}></div>
            <div className={`bar ${strength.score >= 2 ? "on" : ""}`}></div>
            <div className={`bar ${strength.score >= 3 ? "on" : ""}`}></div>
            <div className={`bar ${strength.score >= 4 ? "on" : ""}`}></div>
          </div>
          <p className={`password-strength-text ${strength.level}`}>
            {strength.label}
          </p>
        </div>
      )}
    </div>
  );
}
