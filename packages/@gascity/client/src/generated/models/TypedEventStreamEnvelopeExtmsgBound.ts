/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BoundEventPayload } from './BoundEventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeExtmsgBound = {
    actor: string;
    message?: string;
    payload: BoundEventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'extmsg.bound';
    workflow?: WorkflowEventProjection;
};

