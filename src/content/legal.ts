/* Sender identification used across the legal pages and any commercial email.

   CAN-SPAM requires a valid physical postal address in commercial mail, and the
   same details should be reachable from the site. These are the studio's live
   sender details, and the only values to change when its contact details do —
   every email footer and legal page reads them from here, so a change is a
   change to what customers are told. */
export const LEGAL = {
  entity: "Gray Content Studio",
  email: "kasra@graycontentstudio.co",
  /** Must stay a real, monitored postal address — see CAN-SPAM, above. */
  postalAddress: "Gray Content Studio, 815 Porter Street, Richmond, VA 23224, United States",
  lastUpdated: "August 24, 2026",
} as const;
