import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type AuditAction = 
  | 'user_created' | 'user_updated' | 'user_deleted' | 'user_activated' | 'user_deactivated'
  | 'user_role_changed' | 'user_company_changed' | 'user_profile_updated'
  | 'company_created' | 'company_updated' | 'company_deleted' | 'company_restored'
  | 'invitation_sent' | 'invitation_accepted' | 'invitation_expired' | 'invitation_cancelled'
  | 'bulk_users_updated' | 'bulk_companies_updated' | 'bulk_invitations_sent'
  | 'system_config_updated' | 'maintenance_mode_toggled'
  | 'login_success' | 'login_failed' | 'logout' | 'password_reset'
  | 'data_exported' | 'data_imported' | 'backup_created' | 'backup_restored';

export type AuditResourceType = 
  | 'user' | 'company' | 'invitation' | 'system_config' | 'bulk_operation' | 'security_event';

export type AuditSeverity = 'low' | 'info' | 'warning' | 'error' | 'critical';

export type AuditCategory = 
  | 'user_management' | 'company_management' | 'invitation_management' 
  | 'system_configuration' | 'security_event' | 'data_export' | 'bulk_operations';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: AuditSeverity;
  category?: AuditCategory;
}

export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: data.userId || null,
          action: data.action,
          resource_type: data.resourceType,
          resource_id: data.resourceId || null,
          old_values: data.oldValues || null,
          new_values: data.newValues || null,
          metadata: data.metadata || null,
          ip_address: data.ipAddress || null,
          user_agent: data.userAgent || null,
          severity: data.severity || 'info',
          category: data.category || this.getDefaultCategory(data.action)
        });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  /**
   * Get default category based on action
   */
  private static getDefaultCategory(action: AuditAction): AuditCategory {
    if (action.startsWith('user_')) return 'user_management';
    if (action.startsWith('company_')) return 'company_management';
    if (action.startsWith('invitation_')) return 'invitation_management';
    if (action.startsWith('bulk_')) return 'bulk_operations';
    if (action.startsWith('system_') || action.startsWith('maintenance_')) return 'system_configuration';
    if (action.includes('login') || action.includes('password') || action.includes('security')) return 'security_event';
    if (action.includes('export') || action.includes('import') || action.includes('backup')) return 'data_export';
    return 'user_management';
  }

  /**
   * Log user management actions
   */
  static async logUserAction(
    action: AuditAction,
    userId: string,
    targetUserId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: 'user',
      resourceId: targetUserId,
      oldValues,
      newValues,
      metadata,
      severity: this.getSeverityForAction(action)
    });
  }

  /**
   * Log company management actions
   */
  static async logCompanyAction(
    action: AuditAction,
    userId: string,
    companyId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: 'company',
      resourceId: companyId,
      oldValues,
      newValues,
      metadata,
      severity: this.getSeverityForAction(action)
    });
  }

  /**
   * Log invitation actions
   */
  static async logInvitationAction(
    action: AuditAction,
    userId: string,
    invitationId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: 'invitation',
      resourceId: invitationId,
      oldValues,
      newValues,
      metadata,
      severity: this.getSeverityForAction(action)
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    action: AuditAction,
    userId?: string,
    metadata?: Record<string, any>,
    severity: AuditSeverity = 'warning'
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: 'security_event',
      oldValues: null,
      newValues: null,
      metadata,
      severity
    });
  }

  /**
   * Get severity level for action
   */
  private static getSeverityForAction(action: AuditAction): AuditSeverity {
    const criticalActions = ['user_deleted', 'company_deleted', 'bulk_users_updated'];
    const warningActions = ['user_deactivated', 'invitation_cancelled', 'login_failed'];
    const errorActions = ['login_failed', 'password_reset'];

    if (criticalActions.includes(action)) return 'critical';
    if (warningActions.includes(action)) return 'warning';
    if (errorActions.includes(action)) return 'error';
    return 'info';
  }

  /**
   * Extract client information from request
   */
  static extractClientInfo(request: Request): { ipAddress?: string; userAgent?: string } {
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    return { ipAddress, userAgent };
  }
}
