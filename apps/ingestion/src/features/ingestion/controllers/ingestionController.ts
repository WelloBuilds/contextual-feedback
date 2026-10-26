import IngestionService from "../services/IngestionService";
import IngestionValidator from "../validators/ingestionValidator";

export default class IngestionController {
    public static index(c: any){
        console.log('list');
        return c.text("Ingestion route is working");
    }
    public static async upload(c: any) {
        const body = await c.req.json()

        const workspaceId = c.req.header("Workspace-Id") ?? c.req.header("workspace-id");

        if (!workspaceId) {
            return c.json(
                { error: "A workspace ID header is required" },
                400
            )
        }

        const result = IngestionValidator.upload().safeParse({
            ...body,
            workspaceId,
        });

        if(!result.success){
            return c.json(
                {error:result.error},
                400
            )
        }

        const workspaceExists = await IngestionService.validateWorkspace(workspaceId);
        if (!workspaceExists) {
            return c.json(
                { error: "This workspace ID was not identified" },
                404
            )
        }

        const events = result.data.events.map((event: any) => ({
            ...event,
            workspaceId,
        }));

        const response = await IngestionService.upload(
            events
        );

        return c.json(response);
    }
}
