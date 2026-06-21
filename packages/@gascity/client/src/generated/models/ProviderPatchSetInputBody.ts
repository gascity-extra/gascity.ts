/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProviderPatchSetInputBody = {
    /**
     * Override startup dialog acceptance behavior.
     */
    accept_startup_dialogs?: boolean;
    /**
     * Override ACP transport command arguments.
     */
    acp_args?: any[] | null;
    /**
     * Override ACP transport command binary.
     */
    acp_command?: string;
    /**
     * Override command arguments.
     */
    args?: any[] | null;
    /**
     * Override command binary.
     */
    command?: string;
    /**
     * Override environment variables.
     */
    env?: Record<string, string>;
    /**
     * Provider name.
     */
    name?: string;
    /**
     * Override prompt flag.
     */
    prompt_flag?: string;
    /**
     * Override prompt delivery mode.
     */
    prompt_mode?: string;
    /**
     * Override ready delay in milliseconds.
     */
    ready_delay_ms?: number;
};

