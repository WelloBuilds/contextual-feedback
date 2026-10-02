import { EventType } from "../enums/eventType";
import { ClickPayload } from "./clickPayloadType";
import { ErrorPayload } from "./errorPayloadType";
import { FormInputPayload } from "./formInputPayloadType";
import { FormSubmitPayload } from "./formSubmitPayload";
import { PageViewPayload } from "./pageViewPayloadType";

export type Event =
    | {
          id: string;
          sessionId: string;
          createdAt: Date;
          type: EventType.click;
          payload: ClickPayload;
      }
    | {
          id: string;
          sessionId: string;
          createdAt: Date;
          type: EventType.error;
          payload: ErrorPayload;
      }
    | {
          id: string;
          sessionId: string;
          createdAt: Date;
          type: EventType.formInput;
          payload: FormInputPayload;
      }
    | {
          id: string;
          sessionId: string;
          createdAt: Date;
          type: EventType.formSubmit;
          payload: FormSubmitPayload;
      }
    | {
          id: string;
          sessionId: string;
          createdAt: Date;
          type: EventType.pageView;
          payload: PageViewPayload;
      };