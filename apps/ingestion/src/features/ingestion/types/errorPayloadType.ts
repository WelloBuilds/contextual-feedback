import { ErrorTypes } from "../enums/errorType";

export type ErrorPayload  = {
    message: string;
    type: ErrorTypes;
}