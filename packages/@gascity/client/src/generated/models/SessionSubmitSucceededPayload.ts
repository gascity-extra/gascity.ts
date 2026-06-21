/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionSubmitSucceededPayload = {
    /**
     * Resolved submit intent (default, follow_up, interrupt_now).
     */
    intent: string;
    /**
     * Whether the message was queued for later delivery.
     */
    queued: boolean;
    /**
     * Correlation ID from the 202 response.
     */
    request_id: string;
    /**
     * Session ID that received the submission.
     */
    session_id: string;
};

