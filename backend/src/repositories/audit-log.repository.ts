import AuditLog from "../models/auditlog.model";

interface AuditLogInput {
  actor?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

interface ListFilter {
  page: number;
  limit: number;
}

export const auditLogRepository = {
  create(data: AuditLogInput) {
    return AuditLog.create(data);
  },

  async findAllPaginated(filter: ListFilter) {
    const skip = (filter.page - 1) * filter.limit;

    const [items, total] = await Promise.all([
      AuditLog.find()
        .populate("actor", "fullname email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filter.limit),
      AuditLog.countDocuments(),
    ]);

    return { items, total, page: filter.page, limit: filter.limit };
  },
};