/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProviderUpdateInputBody = {
    /**
     * ACP transport command arguments override.
     */
    acp_args?: any[] | null;
    /**
     * ACP transport command binary override.
     */
    acp_command?: string;
    /**
     * Command arguments.
     */
    args?: any[] | null;
    /**
     * Arguments appended after inherited/base args.
     */
    args_append?: any[] | null;
    /**
     * Provider base for inheritance.
     */
    base?: string;
    /**
     * Provider command binary.
     */
    command?: string;
    /**
     * Human-readable display name.
     */
    display_name?: string;
    /**
     * Environment variables.
     */
    env?: Record<string, string>;
    /**
     * Options schema merge mode across inheritance chain.
     */
    options_schema_merge?: string;
    /**
     * Flag for prompt delivery.
     */
    prompt_flag?: string;
    /**
     * Prompt delivery mode.
     */
    prompt_mode?: string;
    /**
     * Milliseconds to wait before probing readiness.
     */
    ready_delay_ms?: number;
};

