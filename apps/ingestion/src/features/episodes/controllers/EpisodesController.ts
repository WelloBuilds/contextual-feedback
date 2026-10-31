import type { Context } from "hono";
import EpisodesService from "../services/EpisodesService";
import EpisodesValidator from "../validators/episodesValidator";

export default class EpisodesController {
	// ------------------------------------------------------------
	// MARK: List Episodes
	// ------------------------------------------------------------
	public static async list(c: Context) {
		const result = EpisodesValidator.list().safeParse({
			workspaceId: c.req.query("workspaceId"),
		});

		if (!result.success) return c.json({ error: result.error }, 400);

		const episodes = await EpisodesService.list(result.data.workspaceId);
		return c.json({ episodes });
	}
}
