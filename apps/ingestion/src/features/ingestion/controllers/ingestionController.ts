import IngestionService from "../services/IngestionService";
import IngestionValidator from "../validators/ingestionValidator";

export default class IngestionController {
    public static index(c: any){
        console.log('list');
        return c.text("Ingestion route is working");
    }
    public static async upload(c: any) {
        const body = await c.req.json()

        const schema = IngestionValidator.upload();

        const result = schema.safeParse(body);

        if(!result.success){
            return c.json(
                {error:result.error},
                400
            )
        }

        const response = await IngestionService.upload(
            result.data.events
        );

        return c.json(response);
    }
}