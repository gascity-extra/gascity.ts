/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionCreateSucceededPayload } from './SessionCreateSucceededPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeRequestResultSessionCreate = {
    actor: string;
    city: string;
    message?: string;
    payload: SessionCreateSucceededPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'request.result.session.create';
    workflow?: WorkflowEventProjection;
};

