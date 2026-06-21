/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NoPayload } from './NoPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeConvoyCreated = {
    actor: string;
    message?: string;
    payload: NoPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'convoy.created';
    workflow?: WorkflowEventProjection;
};

