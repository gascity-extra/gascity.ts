/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CityCreateRequest = {
    /**
     * Optional bootstrap profile.
     */
    bootstrap_profile?: CityCreateRequest.bootstrap_profile;
    /**
     * Directory to create the city in. Absolute or relative to $HOME.
     */
    dir: string;
    /**
     * Provider name for the city's default session template. Mutually exclusive with start_command.
     */
    provider?: string;
    /**
     * Custom workspace start command for the city's default session template. Mutually exclusive with provider.
     */
    start_command?: string;
};
export namespace CityCreateRequest {
    /**
     * Optional bootstrap profile.
     */
    export enum bootstrap_profile {
        K8S_CELL = 'k8s-cell',
        KUBERNETES = 'kubernetes',
        KUBERNETES_CELL = 'kubernetes-cell',
        SINGLE_HOST_COMPAT = 'single-host-compat',
    }
}

