/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SupervisorRequestPayload = {
    /**
     * Handler duration in milliseconds.
     */
    duration_ms: number;
    /**
     * Canonical Host header without port.
     */
    host?: string;
    /**
     * HTTP method.
     */
    method: string;
    /**
     * Whether the Origin header, if present, matched CORS policy.
     */
    origin_allowed: boolean;
    /**
     * Request path with query string omitted and length bounded.
     */
    path: string;
    /**
     * Audit phase. Long-lived event streams emit a start record immediately after Host validation, then a complete record when the handler returns. Non-stream requests emit complete only.
     */
    phase: SupervisorRequestPayload.phase;
    /**
     * Network class of the remote address, not the raw address.
     */
    remote_addr_class: SupervisorRequestPayload.remote_addr_class;
    /**
     * HTTP response status code. Start-phase records use 0 before the final response status is known.
     */
    status: number;
};
export namespace SupervisorRequestPayload {
    /**
     * Audit phase. Long-lived event streams emit a start record immediately after Host validation, then a complete record when the handler returns. Non-stream requests emit complete only.
     */
    export enum phase {
        START = 'start',
        COMPLETE = 'complete',
    }
    /**
     * Network class of the remote address, not the raw address.
     */
    export enum remote_addr_class {
        LOOPBACK = 'loopback',
        PRIVATE = 'private',
        PUBLIC = 'public',
        UNKNOWN = 'unknown',
    }
}

