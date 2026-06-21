/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NoPayload } from './NoPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeSessionDraining = {
    actor: string;
    message?: string;
    payload: NoPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'session.draining';
    workflow?: WorkflowEventProjection;
};

