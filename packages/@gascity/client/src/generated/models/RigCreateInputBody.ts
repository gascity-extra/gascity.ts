/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RigCreateInputBody = {
    /**
     * Mainline branch (e.g. main, master). Auto-detected when omitted.
     */
    default_branch?: string;
    /**
     * Rig name.
     */
    name: string;
    /**
     * Filesystem path.
     */
    path: string;
    /**
     * Session name prefix.
     */
    prefix?: string;
};

