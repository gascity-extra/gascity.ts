/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BeadEventPayload } from './BeadEventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeBeadClosed = {
    actor: string;
    message?: string;
    payload: BeadEventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'bead.closed';
    workflow?: WorkflowEventProjection;
};

