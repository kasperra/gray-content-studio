-- Estimate attached from the public pricing calculator (structured, recomputed server-side)
alter table leads add column if not exists estimate jsonb;
