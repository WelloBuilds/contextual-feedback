import { db } from "../../../db";
import { sessions } from "../../../models/session.model";

export default class SessionsService {
	public static async create(
		id: string,
		workspaceId: string,
		visitorId: string,
		lastActivityAt: Date,
	) {
		await db.insert(sessions).values({
			id,
			workspaceId,
			visitorId,
			lastActivityAt,
		}).onConflictDoUpdate({
			target: sessions.id,
			set: {
				lastActivityAt: lastActivityAt,
				updatedAt: new Date(),
			},
		});
	}
}
