/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StoreMaintenanceDonePayload } from './StoreMaintenanceDonePayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeGcStoreMaintenanceDone = {
    actor: string;
    message?: string;
    payload: StoreMaintenanceDonePayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'gc.store.maintenance.done';
    workflow?: WorkflowEventProjection;
};

