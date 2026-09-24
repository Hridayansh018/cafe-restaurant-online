/**
 * @deprecated
 * Precision Flow has migrated to the FastAPI backend.
 * Direct Supabase JS client access is no longer used in the frontend.
 * All database operations are now routed through the FastAPI server via `src/lib/db.ts`.
 */

export const isSupabaseConfigured = false;
export const supabase = null as any;
