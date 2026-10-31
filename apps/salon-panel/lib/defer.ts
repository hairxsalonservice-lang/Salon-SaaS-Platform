// Run non-critical work after the critical dashboard requests have had a
// chance to start. Returns a cleanup function so effects can cancel it.
export function defer(fn: () => void, delayMs = 500): () => void {
  if (typeof window === "undefined") return () => {};
  const id = window.setTimeout(fn, delayMs);
  return () => window.clearTimeout(id);
}
