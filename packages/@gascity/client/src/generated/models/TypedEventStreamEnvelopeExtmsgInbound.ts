/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InboundEventPayload } from './InboundEventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeExtmsgInbound = {
    actor: string;
    message?: string;
    payload: InboundEventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'extmsg.inbound';
    workflow?: WorkflowEventProjection;
};

