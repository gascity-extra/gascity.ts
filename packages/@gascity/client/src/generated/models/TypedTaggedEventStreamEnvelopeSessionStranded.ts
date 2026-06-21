/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionStrandedPayload } from './SessionStrandedPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeSessionStranded = {
    actor: string;
    city: string;
    message?: string;
    payload: SessionStrandedPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'session.stranded';
    workflow?: WorkflowEventProjection;
};

