/**
 * Auto-prepend "+" to a phone number value if the user hasn't typed it.
 * Used in onChange handlers for phone inputs so the E.164 "+" prefix
 * is always present as the user types.
 */
export function autoPrefixPhone(value: string): string {
  const trimmed = value.replace(/^\s+/, "");
  if (!trimmed) return "";
  if (!trimmed.startsWith("+")) return "+" + trimmed;
  return trimmed;
}
