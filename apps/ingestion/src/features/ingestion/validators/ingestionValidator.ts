import z from "zod";

import { EventType } from "../enums/eventType";
import { ErrorTypes } from "../enums/errorType";
import { PageViewTypes } from "../enums/pageViewType";

const eventCommonSchema = z.object({
    id: z.uuid(),
    sessionId: z.uuid(),
});

const clickEventSchema = eventCommonSchema.extend({
    type: z.literal(EventType.click),

    payload: z.object({
        id: z.uuid({
            error: "An invalid ID was entered",
        }),
        className: z.string({
            error: "An invalid class name was entered",
        }),
        tagName: z.string({
            error: "An invalid tag name was entered",
        }),

        x: z.number({
            error: "An invalid X coordinate was entered",
        }).positive({
            error: "Please enter a positive X coordinate",
        }),

        y: z.number({
            error: "An invalid Y coordinate was entered",
        }).positive({
            error: "Please enter a positive Y coordinate",
        }),
    }),
});

const errorEventSchema = eventCommonSchema.extend({
    type: z.literal(EventType.error),

    payload: z.object({
        message: z.string(),
        type: z.enum(ErrorTypes)
    }),
});

const formInputSchema = eventCommonSchema.extend({
    type: z.literal(EventType.formInput),

    payload: z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        tagName: z.string(),
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
        previousUrl: z.url(),
        targetUrl: z.url(),
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
                .array(eventSchema)
                .min(1)
                .max(15),
        });
    }
}