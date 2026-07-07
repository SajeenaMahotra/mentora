import { auditLogRepository } from "../repositories/audit-log.repository";

interface LogParams {
  actor?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export const auditLogService = {
  async log(params: LogParams) {
    try {
      await auditLogRepository.create(params);
    } catch (err) {
      // Audit logging must never break the actual request it's logging.
      console.error("Failed to write audit log:", err);
    }
  },
};