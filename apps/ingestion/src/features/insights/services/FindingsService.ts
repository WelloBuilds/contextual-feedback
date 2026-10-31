import { db } from "../../../db";
import { findings } from "../../../models/finding.model";
import type { FindingStatus } from "../enums/findingStatus";
import { eq, and, type SQL } from "drizzle-orm";

export default class FindingsService {

	// ------------------------------------------------------------
	// MARK: List Findings
	// ------------------------------------------------------------
	public static async list(workspaceId: string, status?: FindingStatus) {
		const conditions: SQL[] = [eq(findings.workspaceId, workspaceId)];

		if (status) {
			conditions.push(eq(findings.status, status));
		}

		return db
			.select()
			.from(findings)
			.where(and(...conditions))
			.orderBy(findings.lastSeenAt);
	}

	// ------------------------------------------------------------
	// MARK: Update Finding Status
	// ------------------------------------------------------------
	public static async updateStatus(id: string, status: FindingStatus) {
		const updated = await db
			.update(findings)
			.set({ status })
			.where(eq(findings.id, id))
			.returning();

		return updated[0] ?? null;
	}
}
