export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function createId(prefix = "mod"): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
