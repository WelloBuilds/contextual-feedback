export type ErrorPayload = {
  message: string;
  type: 'uncaughtException' | 'unhandledRejection' | 'promiseRejection';
};