import z from "zod";

export default class EventContextValidator {
    public static context() {
        return z.object({
            page: z.object({
                id: z.string().max(200).nullable(),
                path: z.string().max(2048),
            }),
        });
    }
}
