import { createSupabaseServer } from "@/lib/supabase/server";
import { getCampaigns, deleteCampaignInquiry, getMailRouting } from "@/modules/campaigns/actions";
import { checkMailer } from "@/modules/diagnostic/email";
import { formatDate, sessionTypeLabel } from "@/modules/campaigns/campaign";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { CampaignEditor } from "./CampaignEditor";

/* Session requests from the seasonal landing pages, and the editable copy
   behind each page. The people themselves live on the CRM board like every
   other lead — this is the structured record behind those cards. */

type Inquiry = {
  id: string;
  campaign_slug: string;
  lead_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  preferred_date: string | null;
  session_type: string | null;
  ideas: string | null;
  customer_emailed_at?: string | null;
  studio_emailed_at?: string | null;
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

export default async function AdminCampaignsPage() {
  const supabase = await createSupabaseServer();
  const [{ data, error }, campaigns, mailer, routing] = await Promise.all([
    supabase
      .from("campaign_inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    getCampaigns(),
    checkMailer(),
    getMailRouting(),
  ]);

  // The migration is applied by hand, so explain rather than error.
  if (error) {
    return (
      <>
        <h1 className="font-display text-[1.6rem] font-semibold mb-3">Campaigns</h1>
        <div className="rounded-lg border border-accent/40 bg-accent-soft p-6 max-w-[64ch]">
          <p className="font-semibold">The campaign tables aren&apos;t set up yet.</p>
          <p className="text-muted text-[0.92rem] mt-2 leading-relaxed">
            Run{" "}
            <code className="text-accent">
              supabase/migrations/0006_campaign_inquiries.sql
            </code>{" "}
            in the Supabase SQL editor, then reload. The landing pages still render until then, but
            requests can&apos;t be saved.
          </p>
        </div>
      </>
    );
  }

  const inquiries = (data ?? []) as Inquiry[];
  const bySlug = new Map(campaigns.map((c) => [c.slug, c]));
  const confirmed = inquiries.filter((i) => i.customer_emailed_at).length;
  const live = campaigns.filter((c) => c.published).length;

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
        <h1 className="font-display text-[1.6rem] font-semibold">Campaigns</h1>
        <span className="rounded-full text-[0.68rem] font-semibold uppercase tracking-[0.1em] px-3 py-1 bg-accent-soft text-accent">
          {live} live
        </span>
      </div>
      <p className="text-muted text-[0.9rem] mb-7 max-w-[68ch]">
        Seasonal landing pages. Every request also creates a lead on the{" "}
        <a href="/admin/crm" className="text-accent hover:underline underline-offset-4">
          CRM board
        </a>
        , and sends a confirmation to the customer plus a copy to the studio.
      </p>

      {!mailer.keySet || !routing.from ? (
        <div className="rounded-lg border border-rule bg-surface p-5 mb-8 max-w-[68ch]">
          <p className="text-[0.92rem]">
            <span className="font-semibold">Email isn&apos;t configured.</span> Requests are still
            saved and still reach the CRM, but neither the customer confirmation nor the studio
            notification is sent. Set <code className="text-accent">RESEND_API_KEY</code> and{" "}
            <code className="text-accent">CAMPAIGN_FROM_EMAIL</code> in Vercel, then redeploy.
          </p>
        </div>
      ) : (
        /* Both addresses resolve through fallbacks, so the dashboard doesn't
           show what a deployment will actually do — this does. */
        <div className="rounded-lg border border-rule bg-surface p-5 mb-8 max-w-[68ch]">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
            Mail routing
          </p>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 mt-3 text-[0.88rem]">
            <div className="flex gap-2">
              <dt className="text-muted shrink-0">Sends from</dt>
              <dd className="break-all">{routing.from}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted shrink-0">Studio copy to</dt>
              <dd className="break-all">{routing.to}</dd>
            </div>
          </dl>
          <p className="text-muted text-[0.78rem] mt-3 leading-relaxed">
            Set with <code className="text-accent">CAMPAIGN_FROM_EMAIL</code> and{" "}
            <code className="text-accent">CAMPAIGN_NOTIFY_EMAIL</code>. Campaign mail sends under
            its own address so it doesn&apos;t inherit the diagnostic&apos;s sender.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <Stat label="Requests" value={inquiries.length} />
        <Stat label="Confirmed by email" value={confirmed} sub="Customer received a confirmation" />
        <Stat
          label="This month"
          value={
            inquiries.filter(
              (i) => new Date(i.created_at).getMonth() === new Date().getMonth()
            ).length
          }
        />
        <Stat label="Campaigns" value={campaigns.length} sub={`${live} published`} />
      </div>

      {inquiries.length === 0 ? (
        <p className="text-muted text-[0.92rem]">
          No requests yet. They&apos;ll appear here as soon as someone submits the form.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[860px] text-left text-[0.88rem]">
            <thead>
              <tr className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                <th className="font-medium py-2 pr-4">Received</th>
                <th className="font-medium py-2 pr-4">Name</th>
                <th className="font-medium py-2 pr-4">Contact</th>
                <th className="font-medium py-2 pr-4">Preferred date</th>
                <th className="font-medium py-2 pr-4">Type</th>
                <th className="font-medium py-2 pr-4">Campaign</th>
                <th className="font-medium py-2 pr-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {inquiries.map((i) => {
                const campaign = bySlug.get(i.campaign_slug);
                return (
                  <tr key={i.id} className="border-t border-rule align-top">
                    <td className="py-3 pr-4 text-muted whitespace-nowrap">{short(i.created_at)}</td>
                    <td className="py-3 pr-4">
                      <span className="block font-medium">{i.name}</span>
                      {i.ideas && (
                        <span className="block text-muted text-[0.8rem] mt-1 max-w-[34ch] line-clamp-3">
                          {i.ideas}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <a
                        href={`mailto:${i.email}`}
                        className="block text-accent hover:underline underline-offset-4 break-all"
                      >
                        {i.email}
                      </a>
                      {i.phone && (
                        <a
                          href={`tel:${i.phone.replace(/\s+/g, "")}`}
                          className="block text-muted text-[0.82rem] mt-0.5 hover:text-ink"
                        >
                          {i.phone}
                        </a>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {i.preferred_date ? formatDate(i.preferred_date) : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {campaign && i.session_type
                        ? sessionTypeLabel(campaign, i.session_type)
                        : (i.session_type ?? "—")}
                    </td>
                    <td className="py-3 pr-4 text-muted">{campaign?.title ?? i.campaign_slug}</td>
                    <td className="py-3 pr-2">
                      <ConfirmDeleteButton
                        action={deleteCampaignInquiry}
                        args={[i.id]}
                        itemName={`${i.name}'s request`}
                        variant="inline"
                        note="The CRM lead is kept."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {campaigns.map((c) => (
        <CampaignEditor key={c.slug} initial={c} />
      ))}
    </>
  );
}
