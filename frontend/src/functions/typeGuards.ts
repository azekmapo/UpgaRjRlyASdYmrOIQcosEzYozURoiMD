import type { EmailAutomationStatusUpdate, EmailAutomationUpdate } from "@/types/liste-emails-admin/liste-emails-admin";

export function isEmailAutomationUpdate(obj: unknown): obj is EmailAutomationUpdate {
  if (typeof obj !== 'object' || obj === null) return false;

  const o = obj as Record<string, unknown>;

  return (
    o.type === 'EMAIL_AUTOMATION_UPDATE' &&
    typeof o.planification_id === 'number' &&
    typeof o.automation_id === 'string' &&
    typeof o.planification_status === 'string'
  );
}

export function isEmailAutomationStatusUpdate(obj: unknown): obj is EmailAutomationStatusUpdate {
  if (typeof obj !== 'object' || obj === null) return false;

  const o = obj as Record<string, unknown>;

  return (
    o.type === 'EMAIL_AUTOMATION_STATUS_UPDATE' &&
    typeof o.automation_id === 'string' &&
    typeof o.automation_status === 'string'
  );
}
