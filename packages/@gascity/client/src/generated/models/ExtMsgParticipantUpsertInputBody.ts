/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ExtMsgParticipantUpsertInputBody = {
    /**
     * Group ID.
     */
    group_id: string;
    /**
     * Participant handle.
     */
    handle: string;
    /**
     * Participant metadata.
     */
    metadata?: Record<string, string>;
    /**
     * Whether participant is public.
     */
    public?: boolean;
    /**
     * Session ID.
     */
    session_id: string;
};

