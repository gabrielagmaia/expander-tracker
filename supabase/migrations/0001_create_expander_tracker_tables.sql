-- Expander Tracker: initial schema

create table if not exists expander_treatments (
  id              uuid primary key default gen_random_uuid(),
  child_name      text not null,
  start_date      date not null,
  total_days      integer not null default 21,
  turns_per_day   integer not null default 1,
  reminder_time   time,
  status          text not null default 'active',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint chk_total_days     check (total_days > 0),
  constraint chk_turns_per_day  check (turns_per_day > 0),
  constraint chk_treatment_status check (
    status in ('active', 'completed', 'paused')
  )
);

create table if not exists expander_daily_logs (
  id              uuid primary key default gen_random_uuid(),
  treatment_id    uuid not null references expander_treatments(id) on delete cascade,
  day_number      integer not null,
  log_date        date not null,
  status          text not null default 'pending',
  completed_at    timestamptz,
  discomfort_level integer,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (treatment_id, day_number),
  unique (treatment_id, log_date),

  constraint chk_log_status check (
    status in ('pending', 'done', 'missed', 'skipped_by_dentist')
  ),
  constraint chk_discomfort_level check (
    discomfort_level is null or (discomfort_level >= 1 and discomfort_level <= 5)
  ),
  constraint chk_day_number check (day_number > 0)
);

create table if not exists dentist_appointments (
  id                   uuid primary key default gen_random_uuid(),
  treatment_id         uuid not null references expander_treatments(id) on delete cascade,
  appointment_date     date not null,
  appointment_time     time,
  provider_name        text,
  location             text,
  appointment_type     text,
  notes                text,
  dentist_instructions text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint chk_appointment_type check (
    appointment_type is null or appointment_type in (
      'installation', 'follow_up', 'adjustment', 'emergency', 'final_check', 'other'
    )
  )
);

-- Indexes for common queries
create index if not exists idx_daily_logs_treatment_id on expander_daily_logs(treatment_id);
create index if not exists idx_daily_logs_log_date on expander_daily_logs(log_date);
create index if not exists idx_appointments_treatment_id on dentist_appointments(treatment_id);
create index if not exists idx_appointments_date on dentist_appointments(appointment_date);
