/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionMessageSucceededPayload } from './SessionMessageSucceededPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeRequestResultSessionMessage = {
    actor: string;
    message?: string;
    payload: SessionMessageSucceededPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'request.result.session.message';
    workflow?: WorkflowEventProjection;
};

