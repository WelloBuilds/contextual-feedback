import z from "zod";

export default class EpisodesValidator {
	public static list() {
		return z.object({
			workspaceId: z.uuid({ error: "An invalid workspace ID was entered" }),
		});
	}
}
