/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SupervisorStartedPayload = {
    /**
     * How the previous supervisor instance exited: clean (it completed its STOPPING path and left the shutdown handoff token), crash (a prior instance ran but left no token), or unknown (no evidence of a prior instance).
     */
    previous_exit: SupervisorStartedPayload.previous_exit;
};
export namespace SupervisorStartedPayload {
    /**
     * How the previous supervisor instance exited: clean (it completed its STOPPING path and left the shutdown handoff token), crash (a prior instance ran but left no token), or unknown (no evidence of a prior instance).
     */
    export enum previous_exit {
        CLEAN = 'clean',
        CRASH = 'crash',
        UNKNOWN = 'unknown',
    }
}

