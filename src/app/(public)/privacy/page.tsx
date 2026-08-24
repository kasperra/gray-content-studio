import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Gray Content Studio collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what ${LEGAL.entity} collects when you use this website, why we collect it, and the choices you have.`}
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Details you give us.</strong> Your name, email address, phone number, company,
            and anything you write in a form — the project inquiry form, the Content Growth
            Diagnostic, and the first-visit offer popup.
          </li>
          <li>
            <strong>Your answers.</strong> The responses you give in the Content Growth Diagnostic
            and the offer popup, together with the assessment we generate from them.
          </li>
          <li>
            <strong>Marketing preferences.</strong> Whether you agreed to marketing email or
            marketing text messages, when you agreed, and the exact wording you agreed to.
          </li>
          <li>
            <strong>Basic usage events.</strong> Anonymous counts of pages and steps viewed, so we
            can see where people leave the diagnostic. These are not linked to you unless you
            choose to give us your details.
          </li>
          <li>
            <strong>Client account data.</strong> If you have a client portal login, the projects,
            files, and messages associated with your account.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To reply to your inquiry and deliver the work you engage us for.</li>
          <li>To send you the diagnostic result or coupon you asked for.</li>
          <li>To send marketing email or text messages — only if you specifically opted in.</li>
          <li>To improve the site and understand which content is useful.</li>
        </ul>
        <p>
          We do not sell your personal information. We do not share it with third parties for their
          own marketing.
        </p>
      </section>

      <section>
        <h2>Service providers</h2>
        <p>
          We use a small number of vendors to run this site: Supabase (database and file storage),
          Vercel (hosting), Resend (transactional email), and Formspree (inquiry notifications).
          They process data on our behalf and under their own security commitments.
        </p>
      </section>

      <section>
        <h2>Marketing consent and opting out</h2>
        <p>
          Giving us an email address or a phone number is never treated on its own as permission to
          market to you. Marketing consent is asked for separately, is unticked by default, and is
          recorded with a timestamp and the version of the wording you saw.
        </p>
        <p>
          Every marketing email includes an unsubscribe link, and unsubscribing takes effect
          promptly. If we send marketing text messages, you can reply STOP to stop them and HELP for
          help; message frequency varies, and message and data rates may apply. Consent to marketing
          is never a condition of purchase.
        </p>
      </section>

      <section>
        <h2>Retention</h2>
        <p>
          We keep inquiry and diagnostic records for as long as they are useful to an ongoing or
          potential engagement, and consent records for as long as we rely on them plus any period
          the law requires. You can ask us to delete your information at any time.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          Write to us at <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> to see, correct, or
          delete the information we hold about you, or to opt out of marketing. Depending on where
          you live, you may have additional rights under your local privacy law.
        </p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          We use your browser&apos;s local storage to remember that you have already seen or
          completed the first-visit offer, so it does not interrupt you again. Signing in to the
          client portal sets a session cookie that keeps you logged in.
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
