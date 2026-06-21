/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionLifecyclePayload } from './SessionLifecyclePayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeSessionWorkQueryFailed = {
    actor: string;
    city: string;
    message?: string;
    payload: SessionLifecyclePayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'session.work_query_failed';
    workflow?: WorkflowEventProjection;
};

