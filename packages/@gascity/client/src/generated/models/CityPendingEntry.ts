/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CityPendingEntry = {
    /**
     * Pending interaction kind (e.g. tool-approval, prompt-for-input).
     */
    kind: string;
    /**
     * Pending interaction request ID.
     */
    request_id: string;
    /**
     * Session ID awaiting a human decision.
     */
    session_id: string;
};

