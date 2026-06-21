/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AgentPatchSetInputBody = {
    /**
     * Agent directory scope.
     */
    dir?: string;
    /**
     * Override environment variables.
     */
    env?: Record<string, string>;
    /**
     * Agent name.
     */
    name?: string;
    /**
     * Override agent scope.
     */
    scope?: string;
    /**
     * Override suspended state.
     */
    suspended?: boolean;
    /**
     * Override tmux session name template.
     */
    tmux_alias?: string;
    /**
     * Override session working directory.
     */
    work_dir?: string;
};

