/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventPayload } from './EventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type EventStreamEnvelope = {
    actor: string;
    message?: string;
    payload?: EventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: string;
    workflow?: WorkflowEventProjection;
};

