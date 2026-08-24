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
  // Event Coverage is an all-inclusive package: the price covers both the
  // on-site day and the edited gallery/recap, so it earns both phases even
  // though no separate Production or Post-Production line is ever sold with it.
  if (sold.has("Production") || sold.has("Photography") || sold.has("Event Coverage")) {
    wanted.add("Production");
  }
  if (sold.has("Post-Production") || sold.has("Content Packages") || sold.has("Event Coverage")) {
    wanted.add("Editing");
  }
  if (sold.has("Social Media Management")) wanted.add("Content Distribution");
  return PROCESS_STEPS.filter((s) => wanted.has(s.title));
}
