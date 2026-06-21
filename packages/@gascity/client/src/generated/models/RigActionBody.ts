/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RigActionBody = {
    /**
     * Action that was performed.
     */
    action: string;
    /**
     * Agents that failed to stop (restart only).
     */
    failed?: any[] | null;
    /**
     * Agents that were killed (restart only).
     */
    killed?: any[] | null;
    /**
     * Rig name.
     */
    rig: string;
    /**
     * Operation result (ok, partial, failed).
     */
    status: string;
};

