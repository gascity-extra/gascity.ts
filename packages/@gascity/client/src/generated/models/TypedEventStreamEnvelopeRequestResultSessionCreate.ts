/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionCreateSucceededPayload } from './SessionCreateSucceededPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeRequestResultSessionCreate = {
    actor: string;
    message?: string;
    payload: SessionCreateSucceededPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'request.result.session.create';
    workflow?: WorkflowEventProjection;
};

