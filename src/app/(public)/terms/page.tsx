import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that apply to your use of the Gray Content Studio website.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={`These terms apply to your use of graycontentstudio.co. Production work is governed by the separate proposal or scope of work you sign with ${LEGAL.entity}.`}
    >
      <section>
        <h2>Using this site</h2>
        <p>
          You may browse, read, and share this site. You may not attempt to break its security,
          access accounts or data that are not yours, scrape it at a rate that degrades it, or use
          it to send unsolicited messages.
        </p>
      </section>

      <section>
        <h2>Our content</h2>
        <p>
          The writing, design, video, and photography on this site belong to {LEGAL.entity} or to the
          clients who commissioned the work. Client footage and logos are shown as portfolio
          examples and remain the property of those clients. Do not reuse either without permission.
        </p>
      </section>

      <section>
        <h2>Assessments and estimates</h2>
        <p>
          The Content Growth Diagnostic and the pricing estimator produce general guidance based on
          the answers you provide. They are not a guarantee of results, and an estimate is not a
          quote or a binding price. Anything binding will be in a signed proposal or scope of work.
        </p>
      </section>

      <section>
        <h2>Client portal accounts</h2>
        <p>
          If we issue you portal credentials, keep them confidential and tell us promptly if you
          think they have been compromised. You are responsible for activity under your login.
        </p>
      </section>

      <section>
        <h2>Offers</h2>
        <p>
          Discounts and coupons issued through this site are subject to the{" "}
          <a href="/offer-terms">Coupon &amp; Offer Terms</a>.
        </p>
      </section>

      <section>
        <h2>No warranty; limitation of liability</h2>
        <p>
          This site is provided as is. To the fullest extent permitted by law, {LEGAL.entity} is not
          liable for indirect or consequential losses arising from your use of the site. Nothing here
          limits liability that cannot lawfully be limited.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms; the date at the top shows when they last changed. Continuing to
          use the site after a change means you accept the updated terms.
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
