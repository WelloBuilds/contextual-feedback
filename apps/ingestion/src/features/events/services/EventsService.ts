import { db } from "../../../db";
import { events } from "../../../models/event.model";
import type { Event } from "../../ingestion/types/eventType";

export default class EventsService {
	public static async create(values: Event[]) {
		await db.insert(events).values(values);
	}
}