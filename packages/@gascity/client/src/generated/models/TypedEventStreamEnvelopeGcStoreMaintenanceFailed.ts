/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StoreMaintenanceFailedPayload } from './StoreMaintenanceFailedPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeGcStoreMaintenanceFailed = {
    actor: string;
    message?: string;
    payload: StoreMaintenanceFailedPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'gc.store.maintenance.failed';
    workflow?: WorkflowEventProjection;
};

