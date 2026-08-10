/* Client-side funnel telemetry.

   Uses sendBeacon so events leave the page out-of-band: the browser owns the
   delivery, nothing blocks on it, and queued events still flush if the visitor
   navigates away mid-diagnostic. Falls back to fetch(keepalive) where sendBeacon
   is unavailable. Never throws and never returns a promise the UI can await —
   telemetry must not be able to delay or break a diagnosis. */

export type TrackEvent = "view" | "start" | "question" | "complete" | "capture" | "cta_click";

const ENDPOINT = "/api/diagnostic/track";

export function beacon(
  event: TrackEvent,
  opts: { sessionId?: string; step?: string; resultPublicId?: string } = {}
): void {
  try {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify({ event, ...opts });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* telemetry is never worth an error */
  }
}
