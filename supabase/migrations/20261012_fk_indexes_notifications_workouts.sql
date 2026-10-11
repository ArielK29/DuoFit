-- Covering indexes for two foreign keys flagged by the performance advisor (they speed up cascades when a member is deleted).
create index if not exists notifications_actor_id_idx on public.notifications (actor_id);
create index if not exists workouts_cancelled_by_idx on public.workouts (cancelled_by);
