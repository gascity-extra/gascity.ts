/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionRespondInputBody = {
    /**
     * Response action (e.g. allow, deny).
     */
    action: string;
    /**
     * Optional response metadata.
     */
    metadata?: Record<string, string>;
    /**
     * Pending interaction request ID (optional).
     */
    request_id?: string;
    /**
     * Optional response text.
     */
    text?: string;
};

