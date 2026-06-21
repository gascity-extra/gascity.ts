/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NoPayload } from './NoPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeOrderFailed = {
    actor: string;
    message?: string;
    payload: NoPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'order.failed';
    workflow?: WorkflowEventProjection;
};

