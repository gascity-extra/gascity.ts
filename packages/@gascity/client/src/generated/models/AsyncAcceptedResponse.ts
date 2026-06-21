/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AsyncAcceptedResponse = {
    /**
     * Supervisor event-stream cursor captured before the async request was accepted. Pass this value as after_cursor to /v0/events/stream to receive the request result without replaying unrelated historical backlog. A value of 0 can also mean no event provider is configured or every event log is empty.
     */
    event_cursor: string;
    /**
     * Correlation ID. Watch /v0/events/stream for request.result.city.create, request.result.city.unregister, or request.failed with this request_id.
     */
    request_id: string;
};

