/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AnnotatedProviderResponse = {
    acp_args?: Array<string>;
    acp_command?: string;
    args?: any[] | null;
    command?: string;
    display_name?: string;
    env?: Record<string, string>;
    /**
     * Provider origin: builtin, city, or builtin+city.
     */
    origin: string;
    prompt_flag?: string;
    prompt_mode?: string;
    ready_delay_ms?: number;
};

