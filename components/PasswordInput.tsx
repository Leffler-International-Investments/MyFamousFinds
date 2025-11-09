// FILE: /components/PasswordInput.tsx
// This version uses the custom CSS classes from globals.css
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
}

function computeStrength(password: string): StrengthInfo {
  let score = 0;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (!password) {
    return { label: "", level: "" };
  }
  if (score <= 2) {
    return {
      label: "Weak - add more characters, numbers & symbols.",
      level: "weak",
    };
  }
  if (score === 3) {
    return {
      label: "Okay - could be stronger.",
      level: "ok",
    };
  }
  if (score === 4) {
    return {
      label: "Strong.",
      level: "strong",
    };
  }
  return {
    label: "Very strong.",
    level: "very-strong",
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
    : { label: "", level: "" as StrengthLevel };

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
      {showStrength && strength.label && (
        <p
          className={`password-strength ${
            strength.level ? `password-strength-${strength.level}` : ""
          }`}
        >
          {strength.label}
        </p>
      )}
    </div>
  );
}
