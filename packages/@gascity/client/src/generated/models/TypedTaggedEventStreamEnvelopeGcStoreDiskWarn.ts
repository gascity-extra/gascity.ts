/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StoreDiskWarnPayload } from './StoreDiskWarnPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeGcStoreDiskWarn = {
    actor: string;
    city: string;
    message?: string;
    payload: StoreDiskWarnPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'gc.store.disk_warn';
    workflow?: WorkflowEventProjection;
};

