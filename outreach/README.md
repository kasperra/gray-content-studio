# Outreach ledger

`evaluated.csv` records which **companies** have already been assessed, and why
the dead ends are dead ends. A scheduled Routine reads it before each run so it
does not spend Clay credits re-researching the same prospects every day.

Deliberately **no names and no email addresses.** Personal contact data does not
belong in git. Two sources cover that instead:

- **"Have we already emailed this person?"** — query the Gmail Sent folder
  (`GMAIL_FETCH_EMAILS`, `in:sent to:<domain>`). Authoritative, and the data
  already lives there.
- **"Is this a live prospect?"** — the app's own `leads` table in Supabase is the
  right long-term home, and the admin CRM already reads it.

## Columns

| `outcome` | Meaning |
|---|---|
| `contacted` | Someone there has been emailed — do not contact again |
| `unreachable` | Tried, no usable contact found (see `reason`) |
| `excluded` | Deliberately not pursued (see `reason`) |

Only ever email **one person per company**, unless an out-of-office explicitly
redirects to a second.

## Appending

An automated run appends its rows and pushes. If you email someone manually, add
the company here so the Routine does not double up.
