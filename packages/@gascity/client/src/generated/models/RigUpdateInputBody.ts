/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RigUpdateInputBody = {
    /**
     * Mainline branch (e.g. main, master).
     */
    default_branch?: string;
    /**
     * Filesystem path.
     */
    path?: string;
    /**
     * Session name prefix.
     */
    prefix?: string;
    /**
     * Whether rig is suspended.
     */
    suspended?: boolean;
};

