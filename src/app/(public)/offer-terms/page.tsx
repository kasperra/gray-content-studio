import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL } from "@/content/legal";
import { getOfferSettings } from "@/modules/offer/actions";

// The published terms restate the live offer, so they must not be frozen at
// build time — a settings change has to reach this page.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Coupon & Offer Terms",
  description: "The terms that apply to discounts and coupons issued by Gray Content Studio.",
};

/* Reads the live offer rules rather than restating them, so the published terms
   can never drift from what the popup is actually handing out. */
export default async function OfferTermsPage() {
  const offer = await getOfferSettings();

  return (
    <LegalPage
      title="Coupon & Offer Terms"
      intro={`These terms apply to any discount code issued by ${LEGAL.entity} through this website.`}
    >
      <section>
        <h2>The current offer</h2>
        <ul>
          <li>
            <strong>Discount:</strong> {offer.discountLabel}
          </li>
          <li>
            <strong>Valid for:</strong> {offer.couponDays} days from the day your code is issued.
            The expiry date is shown with your code and is the date that governs.
          </li>
          <li>
            <strong>Eligibility:</strong> {offer.eligibility}
          </li>
        </ul>
      </section>

      <section>
        <h2>How to redeem</h2>
        <p>
          Give us your code when you inquire, or before your proposal is finalised. The discount is
          applied to the proposal total — it cannot be added after a proposal has been accepted or
          an invoice has been issued.
        </p>
      </section>

      <section>
        <h2>Limits</h2>
        <ul>
          <li>One code per business, and one use per code.</li>
          <li>Codes are not transferable, not for resale, and have no cash value.</li>
          <li>Codes cannot be combined with any other discount or promotional offer.</li>
          <li>A code issued in error, obtained through automated means, or duplicated may be voided.</li>
        </ul>
      </section>

      <section>
        <h2>Changes to the offer</h2>
        <p>
          We may change or end this offer at any time. A code already issued stays valid on the terms
          it was issued under, through its stated expiry date.
        </p>
      </section>

      <section>
        <h2>Your details</h2>
        <p>
          Claiming a code means giving us your email and phone number so we can send it and follow
          up about your project. That is not, on its own, permission to send you marketing — see the{" "}
          <a href="/privacy">Privacy Policy</a> for how marketing consent works and how to opt out.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          {LEGAL.entity} — <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
          <br />
          {LEGAL.postalAddress}
        </p>
      </section>
    </LegalPage>
  );
}
