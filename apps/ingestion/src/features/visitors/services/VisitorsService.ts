import { asc, eq, sql } from "drizzle-orm";
import { db } from "../../../db";
import { visitor } from "../../../models/visitor.model";

export default class VisitorsService {
	public static async list(workspaceId: string) {
		return db.select().from(visitor)
			.where(eq(visitor.workspaceId, workspaceId))
			.orderBy(asc(visitor.createdAt))
	}

	public static async show(id: string) {
		const [result] = await db.select().from(visitor).where(eq(visitor.id, id)).limit(1)
		return result
	}

	public static async create(workspaceId: string, id: string) {
		const [created] = await db.insert(visitor).values({
			workspaceId,
			id,
		}).onConflictDoNothing().returning();
		return created
	}

	public static async upsert(id: string, lastSeenAt: Date | null) {
		const [updated] = await db.update(visitor).set({
			lastSeenAt: lastSeenAt ?? visitor.lastSeenAt,
			updatedAt: new Date(),
		}).where(eq(visitor.id, id)).returning()
		return updated
	}
}
