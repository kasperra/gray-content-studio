import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { getCampaign } from "./actions";
import { CampaignPage } from "./CampaignPage";
import type { Campaign } from "./campaign";

/* Everything a season's route file needs, so adding one is three lines rather
   than a copied page. See the "Adding a season" note at the top of campaigns.ts. */

/** Today as an ISO day, for the date field's `min`. Computed on the server so
    the rendered attribute can't disagree with what the action will accept —
    the page revalidates often enough (see `revalidate` in the route) that this
    never goes stale by more than a few minutes. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A Product/Offer entity for the session, so the price is eligible to surface
    in search results the way the event packages already do. `price` is free
    text the studio can edit, so the numeric value is extracted rather than
    assumed, and the offer is dropped entirely when there isn't one. */
function jsonLd(campaign: Campaign) {
  const url = `${SITE_URL}/${campaign.slug}`;
  const digits = campaign.price.replace(/[^0-9.]/g, "");
  const price = /^\d+(\.\d+)?$/.test(digits) ? digits : null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${campaign.title} — Gray Content Studio`,
    description: campaign.metaDescription,
    url,
    category: "Photography session",
    brand: { "@type": "Organization", name: "Gray Content Studio", url: SITE_URL },
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price,
            availability: "https://schema.org/LimitedAvailability",
            url,
            seller: { "@type": "Organization", name: "Gray Content Studio", url: SITE_URL },
          },
        }
      : {}),
  };
}

export function campaignRoute(slug: string) {
  async function generateMetadata(): Promise<Metadata> {
    const campaign = await getCampaign(slug);
    if (!campaign) return {};
    return {
      title: campaign.metaTitle,
      description: campaign.metaDescription,
      alternates: { canonical: `/${campaign.slug}` },
      // An unpublished season stays out of the index even if someone has the URL.
      ...(campaign.published ? {} : { robots: { index: false, follow: false } }),
      openGraph: {
        title: `${campaign.title} — Gray Content Studio`,
        description: campaign.metaDescription,
        url: `${SITE_URL}/${campaign.slug}`,
        type: "website",
      },
      twitter: { card: "summary_large_image" },
    };
  }

  async function Page() {
    const campaign = await getCampaign(slug);
    if (!campaign || !campaign.published) notFound();

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(campaign)) }}
        />
        <CampaignPage campaign={campaign} minDate={todayIso()} />
      </>
    );
  }

  return { generateMetadata, Page };
}
