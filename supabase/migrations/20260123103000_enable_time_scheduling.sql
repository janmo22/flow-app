-- Enable authentic time scheduling
-- Change scripts.scheduled_date to timestamptz if not already
alter table scripts 
alter column scheduled_date type timestamptz using scheduled_date::timestamptz;

-- Change calendar_events.date to timestamptz
alter table calendar_events 
alter column date type timestamptz using date::timestamptz;
