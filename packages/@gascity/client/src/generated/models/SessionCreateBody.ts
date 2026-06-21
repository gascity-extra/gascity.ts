/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionCreateBody = {
    /**
     * Optional session alias.
     */
    alias?: string;
    /**
     * Create session asynchronously (agent only).
     */
    async?: boolean;
    /**
     * Session target kind: agent or provider.
     */
    kind?: string;
    /**
     * Initial message to send to the session.
     */
    message?: string;
    /**
     * Agent or provider name.
     */
    name?: string;
    /**
     * Provider/agent option overrides.
     */
    options?: Record<string, string>;
    /**
     * Opaque project context identifier.
     */
    project_id?: string;
    /**
     * Deprecated: use alias.
     */
    session_name?: string;
    /**
     * Session title.
     */
    title?: string;
};

