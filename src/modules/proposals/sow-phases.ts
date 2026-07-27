import { PROCESS_STEPS } from "@/content/site";

/** Which production phases a scope of work should list, from the rate-card
    categories actually sold.

    Matched exactly, never by substring: "Post-Production" contains the string
    "Production", and an edit-only scope must not promise a shoot day. */
export function phasesFor(categories: string[]) {
  const sold = new Set(categories);
  const wanted = new Set<string>(["Discovery", "Delivery"]); // every engagement
  if (sold.has("Pre-Production & Strategy")) {
    wanted.add("Strategy");
    wanted.add("Pre-Production");
  }
  if (sold.has("Production") || sold.has("Photography")) wanted.add("Production");
  if (sold.has("Post-Production") || sold.has("Content Packages")) wanted.add("Editing");
  if (sold.has("Social Media Management")) wanted.add("Content Distribution");
  return PROCESS_STEPS.filter((s) => wanted.has(s.title));
}
