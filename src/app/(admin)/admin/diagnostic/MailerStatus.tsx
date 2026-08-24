import { getMailerStatus } from "@/modules/diagnostic/actions";

/* Answers "is the result email actually wired up?" without anyone having to
   open Vercel or Resend. Shows env presence and Resend's own verification
   status for each sending domain. Never renders the API key. */

const OK = "#8ec98e";
const WARN = "#e8c46a";
const BAD = "#d98a7a";

function Dot({ color }: { color: string }) {
  return <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: color }} />;
}

function Row({ label, value, color, note }: { label: string; value: string; color: string; note?: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="mt-2">
        <Dot color={color} />
      </span>
      <div className="min-w-0">
        <span className="text-[0.85rem] text-muted">{label}</span>
        <span className="block text-[0.92rem] break-words" style={{ color }}>
          {value}
        </span>
        {note && <span className="block text-muted text-[0.8rem] mt-0.5">{note}</span>}
      </div>
    </div>
  );
}

export async function MailerStatus() {
  const s = await getMailerStatus();

  // Resend marks a domain "verified" once every record it asked for resolves.
  const verified = s.domains?.filter((d) => d.status === "verified") ?? [];
  // A sending-scoped key can't read /domains, so treat it as good to go.
  const sending = s.keySet && s.fromSet && (verified.length > 0 || s.restrictedKey === true);

  return (
    <section className="mt-14" aria-labelledby="mailer">
      <h2 id="mailer" className="font-display text-[1.2rem] font-semibold">
        Result email
      </h2>
      <p className="text-muted text-[0.9rem] mt-2 max-w-[62ch]">
        {sending
          ? "Configured — leads who submit their email receive their diagnosis."
          : "Not sending yet. Leads are still captured and the roadmap still unlocks on screen; only the email is skipped."}
      </p>

      <div className="mt-5 rounded-lg border border-rule bg-surface p-6 max-w-[70ch]">
        <Row
          label="API key (RESEND_API_KEY)"
          value={s.keySet ? "Set on this deployment" : "Not set"}
          color={s.keySet ? OK : BAD}
          note={s.keySet ? undefined : "Add it in Vercel → Settings → Environment Variables, then redeploy."}
        />
        <Row
          label="From address (DIAGNOSTIC_FROM_EMAIL)"
          value={s.from ?? "Not set"}
          color={s.fromSet ? OK : BAD}
        />

        {s.restrictedKey ? (
          <Row
            label="Resend"
            value="Key valid — scoped to sending only"
            color={OK}
            note="Domain verification status can't be read with a sending-only key. Use a Full access key if you want it shown here."
          />
        ) : s.error ? (
          <Row label="Resend" value={s.error} color={BAD} />
        ) : s.domains === null ? (
          <Row label="Resend domains" value="Not checked" color={WARN} />
        ) : s.domains.length === 0 ? (
          <Row
            label="Resend domains"
            value="No domains added to this Resend account"
            color={BAD}
          />
        ) : (
          s.domains.map((d) => (
            <Row
              key={d.name}
              label={`Domain — ${d.name}`}
              value={d.status}
              color={d.status === "verified" ? OK : d.status === "failed" ? BAD : WARN}
              note={
                d.status === "pending"
                  ? "Resend is still polling DNS. This can take up to ~72h, though it is usually minutes."
                  : d.status === "failed"
                    ? "Re-check the DKIM, SPF and MX records Resend listed for this domain."
                    : undefined
              }
            />
          ))
        )}
      </div>
    </section>
  );
}
