/* Sender identification used across the legal pages and any commercial email.

   CAN-SPAM requires a valid physical postal address in commercial mail, and the
   same details should be reachable from the site. These are the only two values
   to change when the studio's contact details change — everything else reads
   from here.

   TODO(gray): replace both placeholders with the studio's real contact email and
   registered postal address before running the offer popup or any email campaign. */
export const LEGAL = {
  entity: "Gray Content Studio",
  email: "kasra@graycontentstudio.co",
  /** Placeholder — must be a real, monitored postal address. */
  postalAddress: "Gray Content Studio, 815 Porter Street, Richmond, VA 23224, United States",
  lastUpdated: "August 24, 2026",
} as const;
