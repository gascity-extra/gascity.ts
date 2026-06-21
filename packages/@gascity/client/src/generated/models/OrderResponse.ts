/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OrderResponse = {
    capture_output: boolean;
    check?: string;
    description?: string;
    enabled: boolean;
    env?: Record<string, string>;
    exec?: string;
    formula?: string;
    /**
     * @deprecated
     */
    gate?: string;
    interval?: string;
    name: string;
    on?: string;
    pool?: string;
    rig?: string;
    schedule?: string;
    scoped_name: string;
    timeout?: string;
    timeout_ms: number;
    trigger?: string;
    type: string;
};

