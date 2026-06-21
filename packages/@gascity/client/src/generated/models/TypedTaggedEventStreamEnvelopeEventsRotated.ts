/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RotatedPayload } from './RotatedPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeEventsRotated = {
    actor: string;
    city: string;
    message?: string;
    payload: RotatedPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'events.rotated';
    workflow?: WorkflowEventProjection;
};

