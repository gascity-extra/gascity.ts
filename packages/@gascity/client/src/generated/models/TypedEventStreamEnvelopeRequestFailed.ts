/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RequestFailedPayload } from './RequestFailedPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeRequestFailed = {
    actor: string;
    message?: string;
    payload: RequestFailedPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'request.failed';
    workflow?: WorkflowEventProjection;
};

