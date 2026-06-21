/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SupervisorStartup = {
    /**
     * Current phase (when not ready).
     */
    phase?: string;
    /**
     * Phases completed so far.
     */
    phases_completed?: any[] | null;
    /**
     * True when the city is running.
     */
    ready: boolean;
};

