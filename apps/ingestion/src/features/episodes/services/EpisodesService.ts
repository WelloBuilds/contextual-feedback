import { asc, eq } from "drizzle-orm";
import { db } from "../../../db";
import { episodes } from "../../../models/episode.model";

export default class EpisodesService {
	// ------------------------------------------------------------
	// MARK: List Episodes
	// ------------------------------------------------------------
	public static async list(workspaceId: string) {
		return db
			.select()
			.from(episodes)
			.where(eq(episodes.workspaceId, workspaceId))
			.orderBy(asc(episodes.startedAt));
	}
}
