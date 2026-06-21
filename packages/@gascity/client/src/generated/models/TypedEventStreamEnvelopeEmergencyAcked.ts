/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecordModel } from './Record';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeEmergencyAcked = {
    actor: string;
    message?: string;
    payload: RecordModel;
    seq: number;
    subject?: string;
    ts: string;
    type: 'emergency.acked';
    workflow?: WorkflowEventProjection;
};

