/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionSubmitSucceededPayload } from './SessionSubmitSucceededPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeRequestResultSessionSubmit = {
    actor: string;
    city: string;
    message?: string;
    payload: SessionSubmitSucceededPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'request.result.session.submit';
    workflow?: WorkflowEventProjection;
};

