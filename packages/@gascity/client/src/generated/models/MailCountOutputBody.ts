/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MailCountOutputBody = {
    /**
     * True when one or more rig providers failed and the counts are not authoritative.
     */
    partial?: boolean;
    /**
     * Per-provider errors when partial is true.
     */
    partial_errors?: any[] | null;
    /**
     * Total message count.
     */
    total: number;
    /**
     * Unread message count.
     */
    unread: number;
};

