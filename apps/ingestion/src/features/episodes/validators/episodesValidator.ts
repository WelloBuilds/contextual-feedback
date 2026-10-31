import z from "zod";
import { EpisodeStatus } from "../enums/episodeStatus";
import { PatternType } from "../enums/patternType";

const episodeBaseSchema = z.object({
	id: z.uuid(),
	workspaceId: z.uuid(),
	visitorId: z.uuid(),
	sessionId: z.uuid(),
	status: z.enum(EpisodeStatus),
	detectedAt: z.coerce.date(),
	deletedAt: z.coerce.date().nullable().optional(),
	eventIds: z.array(z.uuid()),
	createdAt: z.coerce.date().optional(),
});

const rageClickEpisodeSchema = episodeBaseSchema.extend({
	patternType: z.literal(PatternType.rageClicks),
	targetKey: z.string().min(1),
	startedAt: z.coerce.date(),
	lastOccurredAt: z.coerce.date(),
	closedAt: z.coerce.date().nullable(),
	metrics: z.object({
		patternType: z.literal(PatternType.rageClicks),
		clickCount: z.number().int().nonnegative(),
	}),
});

export default class EpisodesValidator {
	public static create() {
		return z.discriminatedUnion("patternType", [rageClickEpisodeSchema]);
	}

	public static list() {
		return z.object({
			workspaceId: z.uuid({ error: "An invalid workspace ID was entered" }),
		});
	}
}
