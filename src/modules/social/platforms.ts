/* Platform catalog — publishing APIs intentionally NOT integrated (modular, optional, later). */

export type PlatformId =
  | "facebook"
  | "instagram"
  | "threads"
  | "linkedin"
  | "tiktok"
  | "x"
  | "pinterest"
  | "youtube"
  | "gbp";

export const PLATFORMS: { id: PlatformId; label: string; charLimit: number }[] = [
  { id: "instagram", label: "Instagram", charLimit: 2200 },
  { id: "facebook", label: "Facebook", charLimit: 63206 },
  { id: "tiktok", label: "TikTok", charLimit: 2200 },
  { id: "youtube", label: "YouTube", charLimit: 5000 },
  { id: "x", label: "X", charLimit: 280 },
  { id: "threads", label: "Threads", charLimit: 500 },
  { id: "linkedin", label: "LinkedIn", charLimit: 3000 },
  { id: "pinterest", label: "Pinterest", charLimit: 500 },
  { id: "gbp", label: "Google Business", charLimit: 1500 },
];

export const POST_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const TEMPLATE_KINDS = [
  { id: "reel", label: "Reel" },
  { id: "short", label: "Short" },
  { id: "social_post", label: "Social Post" },
  { id: "blog", label: "Blog Article" },
  { id: "newsletter", label: "Newsletter" },
  { id: "caption", label: "Caption" },
] as const;

export type TemplateKind = (typeof TEMPLATE_KINDS)[number]["id"];

/** Tightest character limit across the selected platforms (null when none selected). */
export function tightestLimit(selected: string[]): { limit: number; platform: string } | null {
  const chosen = PLATFORMS.filter((p) => selected.includes(p.id));
  if (!chosen.length) return null;
  const min = chosen.reduce((a, b) => (a.charLimit <= b.charLimit ? a : b));
  return { limit: min.charLimit, platform: min.label };
}
