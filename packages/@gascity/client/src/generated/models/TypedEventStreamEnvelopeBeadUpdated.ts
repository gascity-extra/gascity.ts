/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BeadEventPayload } from './BeadEventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeBeadUpdated = {
    actor: string;
    message?: string;
    payload: BeadEventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'bead.updated';
    workflow?: WorkflowEventProjection;
};

