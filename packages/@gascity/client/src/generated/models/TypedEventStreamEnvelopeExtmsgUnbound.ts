/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UnboundEventPayload } from './UnboundEventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeExtmsgUnbound = {
    actor: string;
    message?: string;
    payload: UnboundEventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'extmsg.unbound';
    workflow?: WorkflowEventProjection;
};

