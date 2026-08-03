// Re-export the shared supabase client for admin use
export { supabase } from '@/lib/supabase';

// Admin-specific helper: log an admin action
// Supports multiple call signatures:
//   logAdminAction({ action, entityType, entityId, entityName, details })
//   logAdminAction('action', 'entityType', 'entityId')
//   logAdminAction('action', 'entityType', 'entityId', { details })
//   logAdminAction('action', 'description string')   // entityType = description
//   logAdminAction('action', 'entityType', { details object })
import { supabase } from '@/lib/supabase';

type LogParams = {
  action: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
};

export async function logAdminAction(
  actionOrParams: string | LogParams,
  entityTypeOrDesc?: string,
  entityIdOrDetails?: string | Record<string, unknown>,
  details?: Record<string, unknown>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let params: LogParams;

    if (typeof actionOrParams === 'object') {
      params = actionOrParams;
    } else {
      const entityId = typeof entityIdOrDetails === 'string' ? entityIdOrDetails : undefined;
      const det = typeof entityIdOrDetails === 'object' ? entityIdOrDetails : details;
      params = {
        action: actionOrParams,
        entityType: entityTypeOrDesc,
        entityId,
        details: det,
      };
    }

    await (supabase.from('admin_logs') as any).insert({
      admin_id:    user.id,
      admin_email: user.email,
      action:      params.action,
      entity_type: params.entityType ?? null,
      entity_id:   params.entityId ?? null,
      entity_name: params.entityName ?? null,
      details:     params.details ?? {},
    });
  } catch {
    // Non-critical — don't let logging failure break the UI
  }
}
