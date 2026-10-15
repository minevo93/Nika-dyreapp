-- Applied remotely after the initial migration. Event trigger remains enabled.
-- No CLI was run; its telemetry was rejected by automatic approval review.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
