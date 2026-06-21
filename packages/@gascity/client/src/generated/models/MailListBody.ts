/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MailListBody = {
    /**
     * The list of messages.
     */
    items: any[] | null;
    /**
     * Cursor for the next page of results.
     */
    next_cursor?: string;
    /**
     * True when one or more rig providers failed and the list is not authoritative.
     */
    partial?: boolean;
    /**
     * Per-provider errors when partial is true.
     */
    partial_errors?: any[] | null;
    /**
     * Total number of messages matching the query.
     */
    total: number;
};

