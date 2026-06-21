/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SupervisorShutdownPayload = {
    /**
     * For source=socket_stop, the address reported by the connecting client. Typically empty for unix-socket peers.
     */
    client_addr?: string;
    /**
     * Resulting shutdown mode.
     */
    mode: SupervisorShutdownPayload.mode;
    /**
     * For source=signal, the human-readable signal name (e.g. "terminated", "interrupt"). Empty for socket_stop.
     */
    signal?: string;
    /**
     * Which path triggered the shutdown.
     */
    source: SupervisorShutdownPayload.source;
};
export namespace SupervisorShutdownPayload {
    /**
     * Resulting shutdown mode.
     */
    export enum mode {
        DESTRUCTIVE = 'destructive',
        PRESERVE_SESSIONS = 'preserve_sessions',
        UNKNOWN = 'unknown',
    }
    /**
     * Which path triggered the shutdown.
     */
    export enum source {
        SIGNAL = 'signal',
        SOCKET_STOP = 'socket_stop',
    }
}

