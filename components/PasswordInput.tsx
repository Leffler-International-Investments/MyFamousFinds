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

function computeStrength(password: string) {
  let score = 0;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (!password) return { label: "", className: "" };

  if (score <= 2) {
    return {
      label: "Weak – add more characters, numbers & symbols.",
      className: "text-red-600",
    };
  }
  if (score === 3) {
    return {
      label: "Okay – could be stronger.",
      className: "text-yellow-700",
    };
  }
  if (score === 4) {
    return {
      label: "Strong.",
      className: "text-green-700",
    };
  }
  return {
    label: "Very strong.",
    className: "text-emerald-700",
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
    : { label: "", className: "" };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-300">
        {label}
      </label>
      <div className="mt-1 flex rounded-md border border-gray-600 bg-gray-900">
        <input
          type={visible ? "text" : "password"}
          name={name}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-l-md border-0 bg-transparent px-3 py-2 text-sm text-gray-100 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="px-3 text-xs font-medium text-gray-300 hover:text-white"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {showStrength && strength.label && (
        <p className={`mt-1 text-[11px] ${strength.className}`}>
          {strength.label}
        </p>
      )}
    </div>
  );
}
