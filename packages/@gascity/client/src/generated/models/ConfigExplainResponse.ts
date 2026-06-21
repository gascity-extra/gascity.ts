/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnnotatedProviderResponse } from './AnnotatedProviderResponse';
import type { ConfigExplainPatches } from './ConfigExplainPatches';
export type ConfigExplainResponse = {
    agents: any[] | null;
    patches: ConfigExplainPatches;
    providers: Record<string, AnnotatedProviderResponse>;
};

