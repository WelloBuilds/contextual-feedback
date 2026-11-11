import z from "zod";

export default class VisitorsValidator {
	public static list() {
		return z.object({ workspaceId: z.uuid() });
	}

	public static show() {
		return z.object({ id: z.uuid() });
	}

	public static create() {
		return z.object({
			workspaceId: z.uuid(),
			id: z.uuid(),
		});
	}

	public static upsert() {
		return z.object({
			lastSeenAt: z.coerce.date().nullable().optional(),
		});
	}
}
