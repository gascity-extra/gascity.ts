/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StoreDiskCriticalPayload } from './StoreDiskCriticalPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeGcStoreDiskCritical = {
    actor: string;
    message?: string;
    payload: StoreDiskCriticalPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'gc.store.disk_critical';
    workflow?: WorkflowEventProjection;
};

