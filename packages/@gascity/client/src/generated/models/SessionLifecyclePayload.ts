/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionLifecyclePayload = {
    /**
     * Short human-readable reason.
     */
    reason?: string;
    /**
     * Canonical session bead ID. Always present.
     */
    session_id: string;
    /**
     * Session template name when known at the emission site.
     */
    template?: string;
};

