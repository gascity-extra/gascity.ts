/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SupervisorEventListOutputBody = {
    /**
     * Supervisor event-stream cursor captured before the history snapshot was listed. Pass this value as after_cursor to /v0/events/stream to receive events emitted after the snapshot boundary without replaying unrelated historical backlog.
     */
    event_cursor: string;
    items: any[] | null;
    total: number;
};

