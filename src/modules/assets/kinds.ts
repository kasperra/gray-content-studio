export type AssetKind = "video" | "photo" | "logo" | "graphic" | "doc" | "music" | "file";

export const ASSET_KINDS: AssetKind[] = ["video", "photo", "logo", "graphic", "doc", "music", "file"];

export const KIND_ICONS: Record<AssetKind, string> = {
  video: "🎬",
  photo: "🖼",
  logo: "◈",
  graphic: "✦",
  doc: "📄",
  music: "♪",
  file: "▣",
};

export function kindFromMime(mime: string): AssetKind {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/svg")) return "graphic";
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("audio/")) return "music";
  if (mime.includes("pdf") || mime.includes("word") || mime.includes("text")) return "doc";
  return "file";
}
