import type { Context } from "hono";
import VisitorsService from "../services/VisitorsService";
import VisitorsValidator from "../validators/visitorsValidator";

export default class VisitorsController {

	// ------------------------------------------------------------
	// MARK: List Visitors 
	// ------------------------------------------------------------

	public static async list(c: Context) {
		const result = VisitorsValidator.list().safeParse({
			workspaceId: c.req.query("workspaceId"),
		})
		if (!result.success) return c.json({ error: result.error }, 400)

		const visitors = await VisitorsService.list(result.data.workspaceId)
		return c.json({ visitors })
	}

	// ------------------------------------------------------------
	// MARK: Show Visitor 
	// ------------------------------------------------------------

	public static async show(c: Context) {
		const result = VisitorsValidator.show().safeParse({ id: c.req.param("id") })
		if (!result.success) return c.json({ error: result.error }, 400)

		const visitor = await VisitorsService.show(result.data.id)
		if (!visitor) return c.json({ error: "Visitor not found" }, 404)
		return c.json({ visitor })
	}

	// ------------------------------------------------------------
	// MARK: Create Visitor 
	// ------------------------------------------------------------

	public static async create(c: Context) {
		const body = await c.req.json()
		const result = VisitorsValidator.create().safeParse(body)
		if (!result.success) return c.json({ error: result.error }, 400)

		const visitor = await VisitorsService.create(result.data.workspaceId, result.data.id)
		if (!visitor) return c.json({ error: "Visitor already exists" }, 409)
		return c.json({ visitor }, 201)
	}

	// ------------------------------------------------------------
	// MARK: Upsert Visitor 
	// ------------------------------------------------------------

	public static async upsert(c: Context) {
		const params = VisitorsValidator.show().safeParse({ id: c.req.param("id") })
		if (!params.success) return c.json({ error: params.error }, 400)

		const body = await c.req.json()
		const result = VisitorsValidator.upsert().safeParse(body)
		if (!result.success) return c.json({ error: result.error }, 400)

		const visitor = await VisitorsService.upsert(params.data.id, result.data.lastSeenAt ?? null)
		if (!visitor) return c.json({ error: "Visitor not found" }, 404)
		return c.json({ visitor })
	}
}
