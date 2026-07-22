-- =========================
-- 010_add_booking_time
-- =========================
-- Add booking time field to bookings table and duration_hours to tours table

-- Add booking_time to bookings table
alter table public.bookings
add column if not exists booking_time time;

-- Add duration_hours to tours table (in hours, e.g., 8.5 for 8.5 hours)
alter table public.tours
add column if not exists duration_hours numeric(4,2);

-- Update duration_hours from existing duration text if possible
-- This extracts hours from common duration formats like "8-9 hours", "Full Day (8–9 hours)", etc.
update public.tours
set duration_hours = (
  case
    when duration ~* '(\d+\.?\d*)\s*-?\s*(\d+\.?\d*)\s*hours?' then
      -- Extract average of range (e.g., "8-9 hours" -> 8.5)
      (regexp_replace(duration, '.*?(\d+\.?\d*)\s*-?\s*(\d+\.?\d*)\s*hours?.*', '\1', 'g')::numeric +
       regexp_replace(duration, '.*?(\d+\.?\d*)\s*-?\s*(\d+\.?\d*)\s*hours?.*', '\2', 'g')::numeric) / 2
    when duration ~* '(\d+\.?\d*)\s*hours?' then
      -- Extract single hour value
      regexp_replace(duration, '.*?(\d+\.?\d*)\s*hours?.*', '\1', 'g')::numeric
    when duration ~* 'full\s*day' then
      -- Full day tours typically 8 hours
      8.0
    when duration ~* 'half\s*day' then
      -- Half day tours typically 4 hours
      4.0
    else
      -- Default to 8 hours if can't parse
      8.0
  end
)
where duration_hours is null and duration is not null;

-- Set default duration_hours for tours without duration text
update public.tours
set duration_hours = 8.0
where duration_hours is null;

-- Add comment
comment on column public.bookings.booking_time is 'Start time for the tour booking (HH:MM:SS format)';
comment on column public.tours.duration_hours is 'Tour duration in hours (e.g., 8.5 for 8.5 hours)';

