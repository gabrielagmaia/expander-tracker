-- Migration 0002: add completed_at to treatments, add 'cancelled' status
-- DO NOT RUN AGAINST PRODUCTION WITHOUT REVIEW.
-- Review the backfill comment below before applying.

-- 1. Add completed_at column (nullable, safe to add to existing rows)
alter table expander_treatments
  add column if not exists completed_at timestamptz;

-- 2. Expand the status constraint to include 'cancelled'
alter table expander_treatments
  drop constraint if exists chk_treatment_status;

alter table expander_treatments
  add constraint chk_treatment_status check (
    status in ('active', 'completed', 'paused', 'cancelled')
  );

-- 3. Optional backfill: set completed_at for existing completed treatments
--    using their updated_at timestamp as the best available approximation.
--    Review your data before running this UPDATE.
--
-- update expander_treatments
--   set completed_at = updated_at
--   where status = 'completed'
--     and completed_at is null;
