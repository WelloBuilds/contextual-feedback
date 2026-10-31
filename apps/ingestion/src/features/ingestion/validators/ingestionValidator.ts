import z from "zod";

import { EventType } from "../enums/eventType";
import { ErrorTypes } from "../enums/errorType";
import { PageViewTypes } from "../enums/pageViewType";
import EventContextValidator from "./eventContextValidator";

const eventCommonSchema = z.object({
    id: z.uuid({
        error: "An invalid event ID was entered",
    }),
    visitorId: z.uuid({
        error: "An invalid visitor ID was given",
    }),
    sessionId: z.uuid({
        error: "An invalid session ID was entered",
    }),
    createdAt: z.coerce.date({
        error: "An invalid created at date was entered",
    }),
    context: EventContextValidator.context().optional(),
});

const clickEventSchema = eventCommonSchema.extend({
    type: z.literal(EventType.click),

    payload: z.object({
        id: z.string().nullable().optional(),

        className: z.string().nullable().optional(),

        tagName: z.string().nullable().optional(),

        targetId: z.string().nullable().optional(),

        role: z.string().nullable().optional(),

        accessibleName: z.string().nullable().optional(),

        fingerprint: z.string().nullable().optional(),

        ignoredForRage: z.boolean().optional(),

        isTrusted: z.boolean().optional(),

        x: z
            .number({
                error: "An invalid X coordinate was entered",
            })
            .positive({
                error: "Please enter a positive X coordinate",
            }),

        y: z
            .number({
                error: "An invalid Y coordinate was entered",
            })
            .positive({
                error: "Please enter a positive Y coordinate",
            }),
    }),
});

const errorEventSchema = eventCommonSchema.extend({
    type: z.literal(EventType.error),

    payload: z.object({
        message: z.string({
            error: "An invalid error message was entered",
        }),

        type: z.enum(ErrorTypes, {
            error: "An invalid error type was entered",
        }),
    }),
});

const formInputSchema = eventCommonSchema.extend({
    type: z.literal(EventType.formInput),

    payload: z.object({
        id: z.string({
            error: "An invalid input ID was entered",
        }),

        name: z.string({
            error: "An invalid input name was entered",
        }),

        type: z.string({
            error: "An invalid input type was entered",
        }),

        tagName: z.string({
            error: "An invalid input tag name was entered",
        }),
    }),
});

const formSubmitSchema = eventCommonSchema.extend({
    type: z.literal(EventType.formSubmit),

    payload: z.object({
        id: z.string().nullable(),

        name: z.string().nullable(),

        action: z.string().nullable(),

        method: z.string().nullable(),
    }),
});

const pageViewSchema = eventCommonSchema.extend({
    type: z.literal(EventType.pageView),

    payload: z.object({
        previousPath: z.string().max(2048),

        targetPath: z.string().max(2048),

        type: z.enum(PageViewTypes).nullish(),
    }),
});

const eventSchema = z.discriminatedUnion("type", [
    clickEventSchema,
    errorEventSchema,
    formInputSchema,
    formSubmitSchema,
    pageViewSchema,
]);

export default class IngestionValidator {
    public static upload() {
        return z.object({
            workspaceId: z.string({
                error: "A workspace ID is required",
            })
            .uuid({
                error: "An invalid workspace ID was provided",
            }),
            events: z
                .array(eventSchema, {
                    error: "Events must be provided as an array",
                })
                .min(1, {
                    error: "At least one event must be provided",
                })
                .max(15, {
                    error: "A maximum of 15 events can be uploaded at once",
                })
        });
    }
}
