/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionResetStalledPayload } from './SessionResetStalledPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeSessionResetStalled = {
    actor: string;
    message?: string;
    payload: SessionResetStalledPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'session.reset_stalled';
    workflow?: WorkflowEventProjection;
};

