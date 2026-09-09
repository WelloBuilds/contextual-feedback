import IngestionService from "../services/IngestionService";
import IngestionValidator from "../validators/ingestionValidator";

export default class IngestionController {
    public static async upload(c: any) {
        const body = await c.req.json();

        const schema = IngestionValidator.upload();

        const validatedEventsBody = schema.parse(body);

        const res = await IngestionService.upload(
            validatedEventsBody.events
        );

        return c.json(res);
    }
}