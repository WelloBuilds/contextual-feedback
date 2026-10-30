import { Context } from "hono";
import FindingsService from "../services/FindingsService";
import FindingsValidator from "../validators/findingsValidator";

export default class FindingsController {
	public static async list(c: Context) {
		const result = FindingsValidator.list().safeParse({
			workspaceId: c.req.query("workspaceId"),
			status: c.req.query("status"),
		});

		if (!result.success) {
			return c.json(
				{ error: result.error },
				400
			);
		}

		const findings = await FindingsService.list(
			result.data.workspaceId,
			result.data.status
		);

		return c.json({ findings });
	}

	public static async update(c: Context) {
		const id = c.req.param("id");

		if (!id) {
			return c.json({ error: "A finding ID is required" }, 400);
		}

		const body = await c.req.json();

		const result = FindingsValidator.update().safeParse(body);

		if (!result.success) {
			return c.json(
				{ error: result.error },
				400
			);
		}

		const updated = await FindingsService.updateStatus(
			id,
			result.data.status
		);

		if (!updated) {
			return c.json({ error: "Finding not found" }, 404);
		}

		return c.json({ finding: updated });
	}
}