-- Records that the coupon email actually left the building, so a "did they get
-- it?" question has an answer. Optional: claimOffer tolerates this column being
-- absent, the same way lead inserts tolerate a missing estimate column.
alter table offer_claims add column if not exists coupon_emailed_at timestamptz;
