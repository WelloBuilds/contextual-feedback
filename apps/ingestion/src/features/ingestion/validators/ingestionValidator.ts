import z from "zod";

import { EventType } from "../enums/eventType";
import { ErrorTypes } from "../enums/errorType";
import { PageViewTypes } from "../enums/pageViewType";

const eventCommonSchema = z.object({
    id: z.uuid({
        error: "An invalid event ID was entered",
    }),

    sessionId: z.uuid({
        error: "An invalid session ID was entered",
    }),
    createdAt: z.coerce.date({
        error: "An invalid created at date was entered",
    }),
});

const clickEventSchema = eventCommonSchema.extend({
    type: z.literal(EventType.click),

    payload: z.object({
        id: z.string({
            error: "An invalid ID was entered",
        }),

        className: z.string({
            error: "An invalid class name was entered",
        }),

        tagName: z.string({
            error: "An invalid tag name was entered",
        }),

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
        previousUrl: z.url({
            error: "An invalid previous URL was entered",
        }),

        targetUrl: z.url({
            error: "An invalid target URL was entered",
        }),

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
            events: z
                .array(eventSchema, {
                    error: "Events must be provided as an array",
                })
                .min(1, {
                    error: "At least one event must be provided",
                })
                .max(15, {
                    error: "A maximum of 15 events can be uploaded at once",
                }),
        });
    }
}