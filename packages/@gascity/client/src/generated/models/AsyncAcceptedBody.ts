/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AsyncAcceptedBody = {
    /**
     * City event-stream sequence captured before the async request was accepted. Pass this value as after_seq to /v0/city/{cityName}/events/stream to receive the request result without replaying unrelated historical backlog. A value of 0 can also mean no event provider is configured or the event log is empty.
     */
    event_cursor: string;
    /**
     * Correlation ID. Watch the city event stream for request.result.session.create, request.result.session.message, request.result.session.submit, or request.failed with this request_id.
     */
    request_id: string;
    /**
     * Async request status.
     */
    status: string;
};

