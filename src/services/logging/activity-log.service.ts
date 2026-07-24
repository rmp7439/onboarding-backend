import { prisma } from "../../config/prisma";
import { logger } from "../../utils/logger";

export interface ActorContext {
  id: string;
  name: string;
  email: string;
  role: string;
  ip?: string;
  userAgent?: string;
}

export class ActivityLogService {
  /**
   * Computes the exact fields that changed between two objects.
   * Masks sensitive fields to protect passwords/secrets.
   */
  static computeChanges(oldObj: any, newObj: any, sensitiveFields = ['password', 'token']) {
    const changes: any[] = [];
    const keys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    keys.forEach((key) => {
      // Ignore meta and relation fields
      if (['id', 'createdAt', 'updatedAt', 'documents'].includes(key)) return;

      const oldVal = oldObj?.[key];
      const newVal = newObj?.[key];

      // Convert to strings for safe comparison of dates/numbers/nulls
      const oldStr = oldVal instanceof Date ? oldVal.toISOString() : JSON.stringify(oldVal ?? null);
      const newStr = newVal instanceof Date ? newVal.toISOString() : JSON.stringify(newVal ?? null);

      if (oldStr !== newStr) {
        if (sensitiveFields.includes(key)) {
          changes.push({ field: key, old: '***', new: '***' });
        } else {
          changes.push({ field: key, old: oldVal ?? null, new: newVal ?? null });
        }
      }
    });

    return changes;
  }

  /**
   * Appends a new immutable log entry.
   */
  static async logAction(data: {
    action: string;
    actor: ActorContext;
    target?: { id: string; name: string; type: string };
    changes?: any[];
  }) {
    try {
      await prisma.activityLog.create({
        data: {
          action: data.action,
          actorId: data.actor.id,
          actorName: data.actor.name || 'Unknown',
          actorEmail: data.actor.email,
          actorRole: data.actor.role,
          targetId: data.target?.id,
          targetName: data.target?.name,
          targetType: data.target?.type,
          changes: data.changes || undefined, // <-- FIXED: Changed null to undefined for Prisma compatibility
          ipAddress: data.actor.ip,
          userAgent: data.actor.userAgent,
        }
      });
    } catch (error) {
      // Non-blocking: Do not crash the application if logging fails
      logger.error("Failed to write Activity Log:", error);
    }
  }

  /**
   * Retrieves logs with pagination and filtering.
   */
  static async getLogs(filters: any, page: number = 1, limit: number = 50) {
    const where: any = {};

    if (filters.action) where.action = filters.action;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.role) where.actorRole = filters.role;
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }
    if (filters.search) {
      where.OR = [
        { actorName: { contains: filters.search, mode: 'insensitive' } },
        { actorEmail: { contains: filters.search, mode: 'insensitive' } },
        { targetName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    ]);

    return { total, pages: Math.ceil(total / limit), currentPage: page, logs };
  }
}