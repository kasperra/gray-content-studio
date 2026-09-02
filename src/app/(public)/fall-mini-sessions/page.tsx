import { campaignRoute } from "@/modules/campaigns/route";

/* Thin route — the page lives in modules/campaigns. See "Adding a season" at
   the top of modules/campaigns/campaigns.ts to add the next one. */
const route = campaignRoute("fall-mini-sessions");

export const generateMetadata = route.generateMetadata;
export default route.Page;

// The campaign's copy is editable from Admin → Campaigns, so the page is
// regenerated periodically rather than pinned at build time.
export const revalidate = 300;
