import z from "zod";

import { FindingStatus } from "../enums/findingStatus";

export default class FindingsValidator {
	public static list() {
		return z.object({
			workspaceId: z.uuid({
				error: "An invalid workspace ID was entered",
			}),

			status: z
				.enum(FindingStatus, {
					error: "An invalid finding status was entered",
				})
				.optional(),
		});
	}

	public static update() {
		return z.object({
			status: z.enum(FindingStatus, {
				error: "A valid status is required",
			}),
		});
	}
}
