export function isHttpOrHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }

  if (/\s/.test(trimmed)) {
    return false;
  }

  if (typeof URL !== "function") {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
