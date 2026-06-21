/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfigPatchesResponse } from './ConfigPatchesResponse';
import type { ProviderSpecJSON } from './ProviderSpecJSON';
import type { WorkspaceResponse } from './WorkspaceResponse';
export type ConfigResponse = {
    agents: any[] | null;
    effective_api_url?: string;
    patches?: ConfigPatchesResponse;
    providers?: Record<string, ProviderSpecJSON>;
    rigs: any[] | null;
    workspace: WorkspaceResponse;
};

