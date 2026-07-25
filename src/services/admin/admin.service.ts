import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import {
  ActivityLogService,
  ActorContext,
} from "../logging/activity-log.service";

export class AdminService {
  static async getAdmins() {
    return prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async createAdmin(
    data: { name: string; username: string; password: string },
    actor: ActorContext,
  ) {
    const existing = await prisma.admin.findFirst({
      where: { username: { equals: data.username, mode: "insensitive" } },
    });
    if (existing)
      throw new Error("An Admin with this username already exists.");

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        name: data.name,
        username: data.username.toLowerCase(),
        password: hashedPassword,
        role: "ADMIN",
        active: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        active: true,
      },
    });

    await ActivityLogService.logAction({
      action: "ADMIN_CREATED",
      actor,
      target: { id: newAdmin.id, name: newAdmin.name, type: "ADMIN" },
      changes: [
        { field: "name", old: null, new: newAdmin.name },
        { field: "username", old: null, new: newAdmin.username },
      ],
    });

    return newAdmin;
  }

  static async updateAdmin(
    id: string,
    data: { name?: string; username?: string; active?: boolean },
    actor: ActorContext,
  ) {
    const targetAdmin = await prisma.admin.findUnique({ where: { id } });
    if (!targetAdmin) throw new Error("Admin not found.");

    if (targetAdmin.role === "DEV" || targetAdmin.username === "nikhil") {
      throw new Error("This protected account cannot be modified.");
    }

    if (data.username) {
      const existing = await prisma.admin.findFirst({
        where: { username: { equals: data.username, mode: "insensitive" } },
      });
      if (existing && existing.id !== id)
        throw new Error("Username is already in use.");
      data.username = data.username.toLowerCase();
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        active: true,
      },
    });

    const changes = ActivityLogService.computeChanges(
      targetAdmin,
      updatedAdmin,
    );
    let action = "ADMIN_UPDATED";
    if (targetAdmin.active && data.active === false) action = "ADMIN_DISABLED";
    else if (!targetAdmin.active && data.active === true)
      action = "ADMIN_ENABLED";

    if (changes.length > 0) {
      await ActivityLogService.logAction({
        action,
        actor,
        target: { id: updatedAdmin.id, name: updatedAdmin.name, type: "ADMIN" },
        changes,
      });
    }

    return updatedAdmin;
  }

  static async resetAdminPassword(
    id: string,
    newPassword: string,
    actor: ActorContext,
  ) {
    const targetAdmin = await prisma.admin.findUnique({ where: { id } });
    if (!targetAdmin) throw new Error("Admin not found.");

    if (targetAdmin.role === "DEV" || targetAdmin.username === "nikhil") {
      throw new Error(
        "This protected account password cannot be reset via this endpoint.",
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Log the password change immutably without exposing the secret
    await ActivityLogService.logAction({
      action: "ADMIN_PASSWORD_UPDATED",
      actor,
      target: { id: targetAdmin.id, name: targetAdmin.name, type: "ADMIN" },
      changes: [{ field: "password", old: "***", new: "***" }],
    });
  }

  static async deleteAdmin(id: string, actor: ActorContext) {
    const targetAdmin = await prisma.admin.findUnique({ where: { id } });
    if (!targetAdmin) throw new Error("Admin not found.");

    if (targetAdmin.role === "DEV" || targetAdmin.username === "nikhil") {
      throw new Error(
        "This protected account cannot be deleted.",
      );
    }

    const deletedAdmin = await prisma.admin.delete({ where: { id } });

    // Log deletion
    await ActivityLogService.logAction({
      action: "ADMIN_DELETED",
      actor,
      target: { id: deletedAdmin.id, name: deletedAdmin.name, type: "ADMIN" },
    });

    return deletedAdmin;
  }
}