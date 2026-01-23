ALTER TABLE public.calendar_events 
DROP CONSTRAINT calendar_events_type_check;

ALTER TABLE public.calendar_events 
ADD CONSTRAINT calendar_events_type_check 
CHECK (type IN ('video', 'post', 'newsletter', 'milestone', 'personal', 'carousel'));
