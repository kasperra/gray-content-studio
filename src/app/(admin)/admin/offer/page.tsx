import { createSupabaseServer } from "@/lib/supabase/server";
import { getOfferSettings, deleteOfferClaim } from "@/modules/offer/actions";
import { checkMailer } from "@/modules/diagnostic/email";
import { OFFER_CHOICES } from "@/modules/offer/config";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { OfferSettingsEditor } from "./OfferSettingsEditor";
import { RedeemToggle } from "./RedeemToggle";

/* Coupons issued by the first-visit popup, and the consent recorded with each.
   The people themselves live on the CRM board like every other lead — this page
   is the coupon and consent ledger behind them. */

type Claim = {
  id: string;
  lead_id: string | null;
  email: string;
  phone: string | null;
  answer_id: string;
  stage: number | null;
  coupon_code: string;
  discount_label: string | null;
  expires_at: string | null;
  redeemed_at: string | null;
  coupon_emailed_at?: string | null;
  email_consent: boolean;
  sms_consent: boolean;
  consent_version: string | null;
  created_at: string;
};

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-rule bg-surface p-5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="font-display text-[1.6rem] font-semibold mt-1.5 tabular-nums">{value}</p>
      {sub && <p className="text-muted text-[0.8rem] mt-0.5">{sub}</p>}
    </div>
  );
}

const short = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Unredeemed and past its expiry date. Kept out of the component body so the
    clock read isn't an impure call during render. */
function isExpired(c: { redeemed_at: string | null; expires_at: string | null }) {
  return Boolean(!c.redeemed_at && c.expires_at && new Date(c.expires_at).getTime() < Date.now());
}

export default async function AdminOfferPage() {
  const supabase = await createSupabaseServer();
  const [{ data, error }, settings, mailer] = await Promise.all([
    supabase.from("offer_claims").select("*").order("created_at", { ascending: false }).limit(500),
    getOfferSettings(),
    checkMailer(),
  ]);

  // The migration is applied by hand, so explain rather than error.
  if (error) {
    return (
      <>
        <h1 className="font-display text-[1.6rem] font-semibold mb-3">Offer Popup</h1>
        <div className="rounded-lg border border-accent/40 bg-accent-soft p-6 max-w-[64ch]">
          <p className="font-semibold">The offer tables aren&apos;t set up yet.</p>
          <p className="text-muted text-[0.92rem] mt-2 leading-relaxed">
            Run <code className="text-accent">supabase/migrations/0004_offer_popup.sql</code> in the
            Supabase SQL editor, then reload. The popup stays off until you switch it on here.
          </p>
        </div>
      </>
    );
  }

  const claims = (data ?? []) as Claim[];
  const redeemed = claims.filter((c) => c.redeemed_at).length;
  const expired = claims.filter(isExpired).length;
  const emailOptIn = claims.filter((c) => c.email_consent).length;
  const smsOptIn = claims.filter((c) => c.sms_consent).length;

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
        <h1 className="font-display text-[1.6rem] font-semibold">Offer Popup</h1>
        <span
          className={`rounded-full text-[0.68rem] font-semibold uppercase tracking-[0.1em] px-3 py-1 ${
            settings.enabled ? "bg-accent-soft text-accent" : "border border-rule text-muted"
          }`}
        >
          {settings.enabled ? "Running" : "Off"}
        </span>
      </div>
      <p className="text-muted text-[0.9rem] mb-7 max-w-[68ch]">
        Every claim also creates or updates a lead on the{" "}
        <a href="/admin/crm" className="text-accent hover:underline underline-offset-4">
          CRM board
        </a>
        . This page is the coupon and consent record behind those leads.
      </p>

      {/* Whether codes are actually reaching inboxes, not just the screen. */}
      <p className="text-[0.85rem] mb-7 -mt-4">
        {mailer.keySet && mailer.fromSet ? (
          <span className="text-muted">
            Coupon codes are emailed from <span className="text-ink">{mailer.from}</span> when a code
            is first issued.
          </span>
        ) : (
          <span className="text-[#d98a7a]">
            Codes are shown on screen only — outbound email isn&apos;t configured on this deployment,
            so nothing is sent.
          </span>
        )}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Coupons issued" value={claims.length} />
        <Stat
          label="Redeemed"
          value={redeemed}
          sub={claims.length ? `${Math.round((100 * redeemed) / claims.length)}% of issued` : undefined}
        />
        <Stat label="Expired unused" value={expired} />
        <Stat label="Email opt-ins" value={emailOptIn} />
        <Stat label="SMS opt-ins" value={settings.smsEnabled ? smsOptIn : "—"} sub={settings.smsEnabled ? undefined : "not asked"} />
      </div>

      <section className="mt-10 rounded-lg border border-rule bg-surface p-6" aria-labelledby="wants">
        <h2 id="wants" className="font-display text-[1.1rem] font-semibold mb-5">
          What they said they need
        </h2>
        <div className="space-y-3.5">
          {OFFER_CHOICES.map((c) => {
            const n = claims.filter((x) => x.answer_id === c.id).length;
            const pct = claims.length ? Math.round((100 * n) / claims.length) : 0;
            return (
              <div key={c.id}>
                <div className="flex items-baseline justify-between gap-3 text-[0.85rem]">
                  <span>{c.label}</span>
                  <span className="text-muted tabular-nums whitespace-nowrap">
                    {n} · {pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${Math.max(pct, n ? 2 : 0)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="claims">
        <h2 id="claims" className="font-display text-[1.2rem] font-semibold mb-4">
          Coupons
        </h2>

        {!claims.length ? (
          <p className="text-muted">
            No coupons claimed yet{settings.enabled ? "." : " — the popup is currently switched off."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[0.9rem]">
              <thead>
                <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted border-b border-rule">
                  <th className="py-2.5 pr-4">Contact</th>
                  <th className="py-2.5 pr-4 hidden lg:table-cell">Wants</th>
                  <th className="py-2.5 pr-4">Code</th>
                  <th className="py-2.5 pr-4 hidden sm:table-cell">Consent</th>
                  <th className="py-2.5 pr-4 hidden md:table-cell">Issued</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => {
                  const choice = OFFER_CHOICES.find((x) => x.id === c.answer_id);
                  const expiredNow = isExpired(c);
                  return (
                    <tr key={c.id} className="border-b border-rule align-middle">
                      <td className="py-3 pr-4">
                        <a href={`mailto:${c.email}`} className="font-medium text-accent hover:underline underline-offset-4">
                          {c.email}
                        </a>
                        {c.phone && <span className="block text-muted text-[0.8rem]">{c.phone}</span>}
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell text-muted max-w-[24ch]">
                        {choice?.label ?? c.answer_id}
                      </td>
                      <td className="py-3 pr-4">
                        <code className="text-accent tracking-[0.08em]">{c.coupon_code}</code>
                        <span className="block text-muted text-[0.78rem]">
                          {c.discount_label}
                          {c.expires_at ? ` · ${expiredNow ? "expired" : "expires"} ${short(c.expires_at)}` : ""}
                          {c.coupon_emailed_at ? " · emailed" : ""}
                        </span>
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell text-muted text-[0.8rem] whitespace-nowrap">
                        Email: {c.email_consent ? "yes" : "no"}
                        <br />
                        SMS: {c.sms_consent ? "yes" : "no"}
                        {c.consent_version && (
                          <span className="block text-[0.7rem] opacity-70">v{c.consent_version}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell text-muted whitespace-nowrap">
                        {short(c.created_at)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <RedeemToggle id={c.id} redeemed={Boolean(c.redeemed_at)} />
                          <ConfirmDeleteButton
                            action={deleteOfferClaim}
                            args={[c.id]}
                            itemName={`coupon ${c.coupon_code}`}
                            variant="inline"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <OfferSettingsEditor initial={settings} />
    </>
  );
}
