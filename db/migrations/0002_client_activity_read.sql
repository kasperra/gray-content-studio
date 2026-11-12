-- Phase 2 fix: clients can read their own activity feed (project updates).
-- The original migration only granted admins access to `activities`.

create policy "client reads own activities" on activities for select
  using (client_id = auth_client_id());
